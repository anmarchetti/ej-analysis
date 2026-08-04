using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class FamilyFacilitiesUploadCommandTests
    {
        private readonly FamilyFacilitiesUploadCommand command;
        private readonly IFamilyFacilityUploadReportService reportService;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly ISitecoreUIService sitecoreUiService;

        public FamilyFacilitiesUploadCommandTests()
        {
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            reportService = Substitute.For<IFamilyFacilityUploadReportService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            command = Substitute.ForPartsOf<FamilyFacilitiesUploadCommand>(reportService, destinationsSearchService, null, null, null, Substitute.For<IDestinationsLogger>(), null, sitecoreUiService);
        }

        [Fact]
        public void ProcessItems_ShouldThrowError_IfRowHasEmptyGiataCode()
        {
            // Arrange
            var list = new List<FamilyFacilityTabRow>()
            {
                new FamilyFacilityTabRow() { Description = "desc", GiataCode = null, HotelName = "HotelName01" },
                new FamilyFacilityTabRow() { Description = "desc", GiataCode = "GiataCode2", HotelName = "HotelName02" }
            };

            command.GetFileData<FamilyFacilityTabRow>(Arg.Any<Item>()).Returns(list);
            var hotelItem = new FakeItem();

            var searchResultItem = Substitute.For<BaseHotelSearchResultItem>();
            searchResultItem.GetItem().Returns(hotelItem);
            var searchResults = new List<BaseHotelSearchResultItem>()
            {
                searchResultItem
            };

            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).Returns(searchResults);

            // Act
            void action() => command.ProcessItems(hotelItem);

            // Assert
            Assert.Throws<NullReferenceException>(action);
            reportService.Received().Warn(Arg.Any<string>(), Arg.Any<string>(), "Missing Giata code.");
        }

        [Theory]
        [AutoData]
        public void ProcessItems_ShouldLogDublicateItems_IfRowHasDublicatedGiataCode(string giataCode)
        {
            // Arrange
            var list = new List<FamilyFacilityTabRow>()
            {
                new FamilyFacilityTabRow() { Description = "desc", GiataCode = giataCode, HotelName = "HotelName01" },
                new FamilyFacilityTabRow() { Description = "desc", GiataCode = giataCode, HotelName = "HotelName02" }
            };

            command.GetFileData<FamilyFacilityTabRow>(Arg.Any<Item>()).Returns(list);

            var hotelItem = new FakeItem().WithField(Constants.Fields.AccommodationItem.GiataCode, giataCode);

            var searchResultItem = Substitute.For<BaseHotelSearchResultItem>();
            searchResultItem.GiataCode = giataCode;
            searchResultItem.GetItem().Returns(hotelItem);
            var searchResults = new List<BaseHotelSearchResultItem>()
            {
                searchResultItem
            };

            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).Returns(searchResults);

            // Act
            command.ProcessItems(hotelItem);

            // Assert
            reportService.Received().Warn(Arg.Any<string>(), Arg.Any<string>(), "Duplicate item.");
        }
    }
}
