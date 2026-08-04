using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.HotelBeds.Commands;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Commands
{
    public class RunAccommodationRoomsOnlyUpdateCommandTests : BaseSyncCommandTests
    {
        private readonly TestableRunAccommodationRoomsOnlyUpdateCommand sut;
        private readonly IMasterDataService masterDataService;

        public RunAccommodationRoomsOnlyUpdateCommandTests()
        {
            masterDataService = Substitute.For<IMasterDataService>();
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var userCreationService = Substitute.For<IUserCreationService>();
            var sitecoreUiService = Substitute.For<ISitecoreUIService>();

            sut = new TestableRunAccommodationRoomsOnlyUpdateCommand(
                masterDataService,
                Service,
                Logger,
                databaseProvider,
                userCreationService,
                sitecoreUiService);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void IsCommandContextValid_ShouldBeFalse_WhenAccommodationHasNoHotelBedsCode(string hotelBedsCode)
        {
            var item = new FakeItem(ID.NewID)
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, hotelBedsCode)
                .ToSitecoreItem();
            var commandContext = new CommandContext(item);
            sut.IsCommandContextValid(commandContext).Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void IsCommandContextValid_ShouldBeTrue_WhenAccommodationHasHotelBedsCode(string hotelBedsCode)
        {
            var item = new FakeItem(ID.NewID)
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, hotelBedsCode)
                .ToSitecoreItem();
            var commandContext = new CommandContext(item);
            sut.IsCommandContextValid(commandContext).Should().BeTrue();
        }

        [Fact]
        public void ProcessItems_ShouldSyncRoomsUsingAccommodationAndUpdateIndexes()
        {
            var hotelBedsCode = "HB-4";
            var contextItem = new FakeItem(ID.NewID)
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, hotelBedsCode)
                .ToSitecoreItem();

            var accommodation = new Accommodation { Code = hotelBedsCode };
            masterDataService.GetAccommodation(hotelBedsCode).Returns(accommodation);

            var synced = new List<Item> { new FakeItem(ID.NewID).WithName("Room Item").WithTemplate(Destinations.Constants.TemplateIds.AccommodationRoom).ToSitecoreItem() };
            Service.SyncAccommodationRooms(accommodation, contextItem).Returns(synced);

            var result = sut.InvokeProcessItems(contextItem);

            result.Should().BeEquivalentTo(synced);
            masterDataService.Received(1).GetAccommodation(hotelBedsCode);
            Service.Received(1).SyncAccommodationRooms(accommodation, contextItem);
            Service.Received(1).UpdateMasterIndexes(contextItem);
        }

        private class TestableRunAccommodationRoomsOnlyUpdateCommand : RunAccommodationRoomsOnlyUpdateCommand
        {
            public TestableRunAccommodationRoomsOnlyUpdateCommand(
                IMasterDataService masterDataService,
                easyJet.Foundation.HotelBeds.Services.Sync.ISyncDataService syncDataService,
                easyJet.Foundation.HotelBeds.Logging.IHotelBedsLogger logger,
                IDatabaseProvider databaseProvider,
                IUserCreationService userCreationService,
                ISitecoreUIService sitecoreUiService)
                : base(masterDataService, syncDataService, logger, databaseProvider, userCreationService, sitecoreUiService)
            {
            }

            public IEnumerable<Item> InvokeProcessItems(Item contextItem) => ProcessItems(contextItem);
        }
    }
}
