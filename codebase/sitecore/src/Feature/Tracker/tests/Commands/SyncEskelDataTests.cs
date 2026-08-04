using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using AutoFixture;
using easyJet.Feature.Tracker.Commands;
using easyJet.Feature.Tracker.Models.Eskel;
using easyJet.Feature.Tracker.Services;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.XConnect.Common.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using NSubstitute.ReceivedExtensions;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Sitecore.XConnect;
using Xunit;
using Hotel = easyJet.Foundation.Destinations.Models.Domain.Hotel;

[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.Tracker.Tests.Commands
{
    public class SyncEskelDataTests
    {
        private readonly Fixture fixture;
        private readonly IDestinationsSearchService destinationsSearchServiceMock;
        private readonly IContactService contactServiceMock;
        private readonly IEskelService eskelServiceMock;
        private readonly IXdbService xdbServiceMock;
        private readonly SyncEskelData sut;
        private readonly IUserCreationService userCreationService;

        public SyncEskelDataTests()
        {
            fixture = new Fixture();
            destinationsSearchServiceMock = Substitute.For<IDestinationsSearchService>();
            contactServiceMock = Substitute.For<IContactService>();
            eskelServiceMock = Substitute.For<IEskelService>();
            xdbServiceMock = Substitute.For<IXdbService>();
            userCreationService = Substitute.For<IUserCreationService>();
            sut = Substitute.ForPartsOf<SyncEskelData>(destinationsSearchServiceMock, contactServiceMock, eskelServiceMock, xdbServiceMock, userCreationService);
        }

        [Fact]
        public async void UpdateContactsBookingsAsync_WithoutBatchSubmit_SubmitsIndependently()
        {
            // Arrange
            var clientSubstitute = Substitute.For<IXdbContext>();
            var mail = fixture.Create<string>();
            var destinations = fixture.Create<List<Hotel>>();
            var contacts = new ReadOnlyCollection<Contact>(new List<Contact>() { new Contact(new ContactIdentifier("aSource", mail, ContactIdentifierType.Known)) });
            var contactGrouping = new Dictionary<string, List<Booking>>()
            {
                { mail, fixture.Create<List<Booking>>() }
            };

            // Act
            var result = await sut.UpdateContactsBookingsAsync(clientSubstitute, mail, destinations, contacts, contactGrouping, false);

            // Assert
            result.Should().BeTrue();
            await clientSubstitute.Received().SubmitAsync();
        }

        [Fact]
        public async void UpdateContactsBookingsAsync_OnException_ReturnsFalse()
        {
            // Arrange
            var mail = fixture.Create<string>();
            var contactGrouping = new Dictionary<string, List<Booking>>()
            {
                { mail, fixture.Create<List<Booking>>() }
            };

            // Act
            var result = await sut.UpdateContactsBookingsAsync(null, mail, null, null, contactGrouping);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsCommandContextValid_ContextIsAlwaysValid()
        {
            // Arrange
            var ctx = new CommandContext();
            var proxySut = Substitute.ForPartsOf<SyncEskelDataProxy>(destinationsSearchServiceMock, contactServiceMock, eskelServiceMock, xdbServiceMock, userCreationService);

            // Act
            var validityResult = proxySut.IsCommandContextValidProxy(ctx);

            // Assert
            validityResult.Should().BeTrue();
        }

        [Fact]
        public async void Action_WithValidDatesInArgs_StartsUpdateTask()
        {
            // Arrange
            var args = new ClientPipelineArgs();
            args.Parameters.Add("dates", $"{DateTime.UtcNow.AddDays(-1)}|{DateTime.UtcNow}");

            var proxySut = Substitute.ForPartsOf<SyncEskelDataProxy>(destinationsSearchServiceMock, contactServiceMock, eskelServiceMock, xdbServiceMock, userCreationService);
            proxySut.Configure().WhenForAnyArgs(substitute => substitute.UpdateBookings(default, default)).DoNotCallBase();

            // Act
            proxySut.ActionProxy(args);

            // Assert
            await proxySut.ReceivedWithAnyArgs().UpdateBookings(default, default);
        }

        [Theory]
        [MemberData(nameof(SyncEskelDataTestsDataGenerator.FaultyDatesForAction), MemberType = typeof(SyncEskelDataTestsDataGenerator))]
        public async void Action_WithInvalidDatesInArgs_DoesNotStartUpdateTask(string invalidDatesString)
        {
            // Arrange
            var args = new ClientPipelineArgs();
            args.Parameters.Add("dates", invalidDatesString);

            var proxySut = Substitute.ForPartsOf<SyncEskelDataProxy>(destinationsSearchServiceMock, contactServiceMock, eskelServiceMock, xdbServiceMock, userCreationService);
            proxySut.Configure().WhenForAnyArgs(substitute => substitute.UpdateBookings(default, default)).DoNotCallBase();

            // Act
            proxySut.ActionProxy(args);

            // Assert
            await proxySut.DidNotReceiveWithAnyArgs().UpdateBookings(default, default);
        }

        [Fact]
        public async void UpdateBookings_WithBookingsFromEskel_OnNonXDBException_DoesNotFallbackToOneByOne()
        {
            // Arrange
            eskelServiceMock.GetBookings(default, default).ReturnsForAnyArgs(new ReadOnlyCollection<Booking>(new List<Booking>()
            {
                fixture.Create<Booking>(),
                fixture.Create<Booking>(),
                fixture.Create<Booking>()
            }));

            var xdbMock = Substitute.For<IXdbContext>();
            sut.Configure().GetClient().Returns(xdbMock);
            xdbMock.SubmitAsync().Returns(Task.FromException(new Exception()), Task.CompletedTask);

            sut.Configure().HotelBatchSize.Returns(100);

            // Act
            await sut.UpdateBookings(DateTime.UtcNow.AddMonths(-1), DateTime.UtcNow);

            // Assert
            destinationsSearchServiceMock.ReceivedWithAnyArgs(Quantity.AtLeastOne()).GetHotelsByAtcomCodes(default);
            await contactServiceMock.ReceivedWithAnyArgs().GetContacts(default, default);
            // number of calls > 1 implying that batch processing failed and one-by-one approach was utilized.
            await xdbMock.Received(Quantity.Within(2, int.MaxValue)).SubmitAsync();
        }

        [Fact]
        public async void UpdateBookings_WithBookingsFromEskel_OnXDBException_FallsBackToOneByOneSubmit()
        {
            // Arrange
            eskelServiceMock.GetBookings(default, default).ReturnsForAnyArgs(new ReadOnlyCollection<Booking>(new List<Booking>()
            {
                fixture.Create<Booking>(),
                fixture.Create<Booking>(),
                fixture.Create<Booking>()
            }));

            var xdbMock = Substitute.For<IXdbContext>();
            sut.Configure().GetClient().Returns(xdbMock);
            xdbMock.SubmitAsync().Returns(Task.FromException(new XdbExecutionException()), Task.CompletedTask);

            sut.Configure().HotelBatchSize.Returns(100);

            // Act
            await sut.UpdateBookings(DateTime.UtcNow.AddMonths(-1), DateTime.UtcNow);

            // Assert
            destinationsSearchServiceMock.ReceivedWithAnyArgs(Quantity.AtLeastOne()).GetHotelsByAtcomCodes(default);
            await contactServiceMock.ReceivedWithAnyArgs().GetContacts(default, default);
            // number of calls > 1 implying that batch processing failed and one-by-one approach was utilized.
            await xdbMock.Received(Quantity.Within(2, int.MaxValue)).SubmitAsync();
        }

        [Fact]
        public async void UpdateBookings_WithBookingsFromEskel_WithoutXDBException_SubmitsInBatchSuccessfully()
        {
            // Arrange
            eskelServiceMock.GetBookings(default, default).ReturnsForAnyArgs(new ReadOnlyCollection<Booking>(new List<Booking>()
            {
                fixture.Create<Booking>(),
                fixture.Create<Booking>(),
                fixture.Create<Booking>()
            }));

            var xdbMock = Substitute.For<IXdbContext>();
            sut.Configure().GetClient().Returns(xdbMock);

            sut.Configure().HotelBatchSize.Returns(100);

            // Act
            await sut.UpdateBookings(DateTime.UtcNow.AddMonths(-1), DateTime.UtcNow);

            // Assert
            destinationsSearchServiceMock.ReceivedWithAnyArgs(1).GetHotelsByAtcomCodes(default);
            await contactServiceMock.ReceivedWithAnyArgs().GetContacts(default, default);
            await xdbMock.Received(1).SubmitAsync();
        }

        [Fact]
        public async void UpdateBookings_WithoutBookingsInTimeFrameFromEskel_LogsCompletionWithoutAction()
        {
            // Arrange
            eskelServiceMock.GetBookings(default, default)
                .ReturnsForAnyArgs(new ReadOnlyCollection<Booking>(new List<Booking>()));
            var xdbMock = Substitute.For<IXdbContext>();

            sut.Configure().GetClient().Returns(xdbMock);

            // Act
            await sut.UpdateBookings(DateTime.UtcNow.AddMonths(-1), DateTime.UtcNow);

            // Assert
            destinationsSearchServiceMock.DidNotReceiveWithAnyArgs().GetHotelsByAtcomCodes(default);
            await contactServiceMock.DidNotReceiveWithAnyArgs().GetContacts(default, default, default);
            await xdbMock.DidNotReceiveWithAnyArgs().SubmitAsync();
        }

        internal class SyncEskelDataProxy : SyncEskelData
        {
            public SyncEskelDataProxy(IDestinationsSearchService destinationsSearchService, IContactService contactService, IEskelService eskelService, IXdbService xdbService, IUserCreationService userCreationService)
                : base(destinationsSearchService, contactService, eskelService, xdbService, userCreationService)
            {
            }

            public void ActionProxy(ClientPipelineArgs args) => base.Action(args);

            public bool IsCommandContextValidProxy(CommandContext ctx) => base.IsCommandContextValid(ctx);
        }
    }
}