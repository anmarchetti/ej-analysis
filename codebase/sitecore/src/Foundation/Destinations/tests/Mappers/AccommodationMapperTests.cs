using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Mappers
{
    public class AccommodationMapperTests
    {
        [Fact]
        public void MapFromSearchResultSuccess()
        {
            var searchResultItem = new HotelSearchResultItem
            {
                Code = "testCode",
                GiataCode = "document.GiataCode",
                Name = "document.ItemName",
                ItemName = "document.Name",
                Description = "document.Description",
                Longitude = 10,
                Latitude = 11,
                StarRating = 4,
                Address = "document.Address",
                City = "document.City",
                PostalCode = "document.PostalCode",
                Website = "document.Website",
                Email = "document.Email",
                BookingPhone = "document.BookingPhone",
                ManagementPhone = "document.ManagementPhone",
                HotelPhone = "document.HotelPhone",
                FaxNumber = "document.FaxNumber",
                Strapline = "document.Strapline",
                HotelRating = 10,
                TripAdvisorId = "document.TripAdvisorId",
                TotalNumberOfReviews = 150,
                KeySellingPoint1 = "document.KeySellingPoint1",
                KeySellingPoint2 = "document.KeySellingPoint2",
                ImageUrl = "document.ImageUrl",
            };

            var result = AccommodationMapper.MapFiltersFromSearchResultItem(searchResultItem.Code, searchResultItem);
            result.Should().NotBeNull();
        }

        [Fact]
        public void MapFiltersFromSearchResultItem_MapsTrackingId_OnFacilityGroupsAndFilteredTypes()
        {
            var facilityHeader = new FacilityHeader
            {
                Name = "Pool",
                TrackingId = "pool-header-tracking",
                FacilityFilteredTypes = new[]
                {
                    new FacilityFilteredType
                    {
                        Code = "pool-wifi",
                        TrackingId = "pool-wifi-tracking",
                        FacilityFilterGroup = new FacilityFilterGroup { Code = "group-code", TrackingId = "group-tracking" },
                    },
                },
            };

            var searchResultItem = new HotelSearchResultItem
            {
                Code = "H1",
                FilteredFacilities = new[] { JsonConvert.SerializeObject(facilityHeader) },
            };

            var result = AccommodationMapper.MapFiltersFromSearchResultItem(searchResultItem.Code, searchResultItem);

            result.FacilityGroups.Should().HaveCount(1);
            result.FacilityGroups[0].TrackingId.Should().Be("pool-header-tracking");
            var filtered = result.FacilitiesFiltered.Single();
            filtered.TrackingId.Should().Be("pool-wifi-tracking");
            filtered.FacilityFilterGroup.TrackingId.Should().Be("group-tracking");
        }

        [Fact]
        public void MapTransfersFromSearchResultItem_Success()
        {
            var doc = new HotelSearchResultItem()
            {
                Transfers = new[]
                {
                    JsonConvert.SerializeObject(new TransferInfo() { AirportId = "test1", }),
                    JsonConvert.SerializeObject(new TransferInfo() { AirportId = "test2", }),
                    JsonConvert.SerializeObject(new TransferInfo() { AirportId = "test3", }),
                    JsonConvert.SerializeObject(new TransferInfo() { AirportId = "test4", }),
                    null,
                }
            };

            var result = AccommodationMapper.MapTransfersFromSearchResultItem(doc);

            result.Should().NotBeNull();
            result.Count().Should().Be(4);
        }

        [Fact]
        public void MapTransfersFromSearchResultItem_WithInvalidJson_SkipsInvalidTransfers()
        {
            var doc = new HotelSearchResultItem
            {
                Transfers = new[]
                {
                    JsonConvert.SerializeObject(new TransferInfo { AirportId = "test1" }),
                    "{invalid-json}",
                    null,
                }
            };

            var result = AccommodationMapper.MapTransfersFromSearchResultItem(doc);

            result.Should().NotBeNull();
            result.Count().Should().Be(1);
        }

        [Fact]
        public void MapFromSearchResultItem_WithInvalidHotelTheme_DoesNotThrowAndReturnsNullHotelTheme()
        {
            var searchResultItem = new HotelSearchResultItem
            {
                HotelTheme = "{invalid-json}",
            };

            var result = AccommodationMapper.MapFromSearchResultItem("testCode", searchResultItem);

            result.Should().NotBeNull();
            result.HotelTheme.Should().BeNull();
        }

        [Fact]
        public void MapFromSearchResultItem_ShouldDeserializeVirtualResorts_WhenValueIsValidJson()
        {
            // Arrange
            var virtualResorts = new List<VirtualResort>
            {
                new VirtualResort { Code = "VR1", Name = "Virtual Resort 1" },
                new VirtualResort { Code = "VR2", Name = "Virtual Resort 2" },
            };

            var doc = new HotelSearchResultItem
            {
                Code = "H1",
                VirtualResorts = JsonConvert.SerializeObject(virtualResorts),
            };

            // Act
            var result = AccommodationMapper.MapFromSearchResultItem(doc.Code, doc);

            // Assert
            result.VirtualResorts.Should().HaveCount(2);
            result.VirtualResorts[0].Code.Should().Be("VR1");
            result.VirtualResorts[1].Code.Should().Be("VR2");
        }

        [Fact]
        public void MapExpediaHotelFacilityFromItem_ShouldMapFacility_WhenFacilityTypeExists()
        {
            using (var db = new Sitecore.FakeDb.Db
    {
        new Sitecore.FakeDb.DbItem("Wi-fi Type", Sitecore.Data.ID.NewID, Constants.TemplateIds.FacilityType)
        {
            { Constants.Fields.DatasourceItem.Code, "550" },
            { Constants.Fields.DatasourceItem.Name, "Wi-fi" }
        },
        new Sitecore.FakeDb.DbItem("Wi-fi", Sitecore.Data.ID.NewID, Constants.TemplateIds.AccommodationFacility)
        {
            { Constants.Fields.BaseFacilityItem.FacilityType, string.Empty },
            { Constants.Fields.AccommodationFacilityItem.TextValue, "Free Wi-fi" }
        }
    })
            {
                var facilityType = db.GetItem("/sitecore/content/Wi-fi Type");
                var facilityItem = db.GetItem("/sitecore/content/Wi-fi");

                facilityItem.Editing.BeginEdit();
                facilityItem[Constants.Fields.BaseFacilityItem.FacilityType] = facilityType.ID.ToString();
                facilityItem.Editing.EndEdit();

                var result = AccommodationMapper.MapExpediaHotelFacilityFromItem(facilityItem);

                result.Should().NotBeNull();
                result.Name.Should().Be("Wi-fi");
                result.FacilityCode.Should().Be("550");
                result.TextValue.Should().Be("Free Wi-fi");
            }
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void MapFromSearchResultItem_ShouldReturnNullVirtualResorts_WhenValueIsNullOrEmpty(string virtualResorts)
        {
            // Arrange
            var doc = new HotelSearchResultItem
            {
                Code = "H1",
                VirtualResorts = virtualResorts,
            };

            // Act
            var result = AccommodationMapper.MapFromSearchResultItem(doc.Code, doc);

            // Assert
            result.VirtualResorts.Should().BeNull();
        }
    }
}
