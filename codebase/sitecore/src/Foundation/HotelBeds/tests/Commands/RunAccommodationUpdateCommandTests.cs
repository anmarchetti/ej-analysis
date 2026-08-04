using System.Collections.Generic;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.HotelBeds.Commands;
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
    public class RunAccommodationUpdateCommandTests : BaseSyncCommandTests
    {
        private readonly TestableRunAccommodationUpdateCommand runAccommodationUpdateCommand;

        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunAccommodationUpdateCommandTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runAccommodationUpdateCommand = new TestableRunAccommodationUpdateCommand(Service, Logger, databaseProvider, userCreationService, sitecoreUiService);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void IsCommandContextValid_ShouldBeFalse_If_TempateIsValid_And_HotelBedsFieldHasNoCode(string hotelbedCode)
        {
            // Arrange
            var item = new FakeItem(ID.NewID)
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, hotelbedCode)
                .ToSitecoreItem();
            var commandContext = new CommandContext(item);

            // Act
            var actual = runAccommodationUpdateCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_If_TempateIsValid_And_NoHotelBedsField()
        {
            // Arrange
            var item = new FakeItem(ID.NewID)
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .ToSitecoreItem();
            var commandContext = new CommandContext(item);

            // Act
            var actual = runAccommodationUpdateCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfTempatesIsNotValid()
        {
            // Arrange
            var item = new FakeItem(ID.NewID)
                .WithTemplate(ID.NewID)
                .ToSitecoreItem();
            var commandContext = new CommandContext(item);

            // Act
            var actual = runAccommodationUpdateCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void IsCommandContextValid_ShouldTrue_If_TempatesIsValid_And_HasHotelBedsCode(string hotelBedsCode)
        {
            // Arrange
            var item = new FakeItem(ID.NewID)
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, hotelBedsCode)
                .ToSitecoreItem();
            var commandContext = new CommandContext(item);

            // Act
            var actual = runAccommodationUpdateCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void ProcessItems_ShouldUpdateAccommodationAndMasterIndexes()
        {
            // Arrange
            const string hotelBedsCode = "HB-5";
            var contextItem = new FakeItem(ID.NewID)
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, hotelBedsCode)
                .ToSitecoreItem();

            var synced = new List<Item> { new FakeItem(ID.NewID).WithName("Accommodation Item").WithTemplate(Destinations.Constants.TemplateIds.Accommodation).ToSitecoreItem() };
            Service.UpdateAccommodations(
                    Arg.Any<IDictionary<string, Item>>(),
                    null,
                    null,
                    true)
                .Returns(synced);

            // Act
            var result = runAccommodationUpdateCommand.InvokeProcessItems(contextItem);

            // Assert
            result.Should().BeEquivalentTo(synced);
            Service.Received(1).UpdateAccommodations(
                Arg.Is<IDictionary<string, Item>>(x => x.Count == 1 && x.ContainsKey(hotelBedsCode) && x[hotelBedsCode] == contextItem),
                null,
                null,
                true);
            Service.Received(1).UpdateMasterIndexes(contextItem);
        }

        private class TestableRunAccommodationUpdateCommand : RunAccommodationUpdateCommand
        {
            public TestableRunAccommodationUpdateCommand(
                easyJet.Foundation.HotelBeds.Services.Sync.ISyncDataService syncDataService,
                easyJet.Foundation.HotelBeds.Logging.IHotelBedsLogger logger,
                IDatabaseProvider databaseProvider,
                IUserCreationService userCreationService,
                ISitecoreUIService sitecoreUiService)
                : base(syncDataService, logger, databaseProvider, userCreationService, sitecoreUiService)
            {
            }

            public IEnumerable<Item> InvokeProcessItems(Item contextItem) => ProcessItems(contextItem);
        }
    }
}
