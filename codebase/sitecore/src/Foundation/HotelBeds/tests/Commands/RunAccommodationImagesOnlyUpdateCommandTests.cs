using System.Collections.Generic;
using AutoFixture.Xunit2;
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
    public class RunAccommodationImagesOnlyUpdateCommandTests : BaseSyncCommandTests
    {
        private readonly TestableRunAccommodationImagesOnlyUpdateCommand sut;

        public RunAccommodationImagesOnlyUpdateCommandTests()
        {
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var userCreationService = Substitute.For<IUserCreationService>();
            var sitecoreUiService = Substitute.For<ISitecoreUIService>();
            sut = new TestableRunAccommodationImagesOnlyUpdateCommand(Service, Logger, databaseProvider, userCreationService, sitecoreUiService);
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
        public void ProcessItems_ShouldSyncImagesAndUpdateIndexes()
        {
            var hotelBedsCode = "HB-3";
            var contextItem = new FakeItem(ID.NewID)
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, hotelBedsCode)
                .ToSitecoreItem();

            var synced = new List<Item> { new FakeItem(ID.NewID).WithName("Image Item").ToSitecoreItem() };
            Service.SyncAccommodationImages(hotelBedsCode, contextItem).Returns(synced);

            var result = sut.InvokeProcessItems(contextItem);

            result.Should().BeEquivalentTo(synced);
            Service.Received(1).SyncAccommodationImages(hotelBedsCode, contextItem);
            Service.Received(1).UpdateMasterIndexes(contextItem);
        }

        private class TestableRunAccommodationImagesOnlyUpdateCommand : RunAccommodationImagesOnlyUpdateCommand
        {
            public TestableRunAccommodationImagesOnlyUpdateCommand(
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
