using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class SearchFiltersServiceTests
    {
        private readonly string searchFiltersPath = "/sitecore/content/Search Filters";
        private readonly SearchFiltersService service;
        private readonly IHtmlCacheRepository cache;
        private readonly IFacilityMatrixService facilityMatrixService;

        public SearchFiltersServiceTests()
        {
            cache = Substitute.ForPartsOf<HtmlCacheRepository>();
            facilityMatrixService = Substitute.For<IFacilityMatrixService>();
            using (new SettingsSwitcher("Destinations.SearchFiltersFolderPath", searchFiltersPath))
            {
                service = new SearchFiltersService(cache, facilityMatrixService);
            }
        }

        [Theory]
        [AutoData]
        public void GetSearchFilters_ShouldReturnSearchFilters_IfFiltersExist(
            Db db,
            DatasourceObject inbound,
            DatasourceObject outbound,
            ID inboundTypeId,
            ID outboundTypeId)
        {
            // Arrange
            cache.GetItem<IEnumerable<SearchFilter>>(Arg.Any<string>()).Returns(l => null);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<SearchFilter>>());

            var inboundTypeDbItem = new DbItem("Inbound", inboundTypeId);
            inboundTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = inbound.Code });
            inboundTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Name) { Value = inbound.Name });

            var outboundTypeDbItem = new DbItem("Outbound", outboundTypeId);
            outboundTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = outbound.Code });
            outboundTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Name) { Value = outbound.Name });

            db.Add(inboundTypeDbItem);
            db.Add(outboundTypeDbItem);

            var searchFiltersDbItem = new DbItem("Search Filters", ID.NewID, Constants.TemplateIds.SearchFiltersFolder);
            var flightsFiltersDbItem = new DbItem("Flights Filters", ID.NewID, Constants.TemplateIds.FlightsFilter);

            var inboundTimeFilterDbItem = new DbItem("Inbound Time", ID.NewID, Constants.TemplateIds.TimeFilter);
            inboundTimeFilterDbItem.Fields.Add(new DbField(Constants.Fields.TimeFilter.FilterType) { Value = inboundTypeDbItem.ID.ToString() });

            var outboundTimeFilterDbItem = new DbItem("Outbound Time", ID.NewID, Constants.TemplateIds.TimeFilter);
            outboundTimeFilterDbItem.Fields.Add(new DbField(Constants.Fields.TimeFilter.FilterType) { Value = outboundTypeDbItem.ID.ToString() });

            var morningTimeSlotDbItem = new DbItem("Morning", ID.NewID);
            morningTimeSlotDbItem.Fields.Add(new DbField(Constants.Fields.TimeSetting.StartTime) { Value = "20220101T060000Z" });
            morningTimeSlotDbItem.Fields.Add(new DbField(Constants.Fields.TimeSetting.EndTime) { Value = "20220101T120000Z" });
            morningTimeSlotDbItem.Fields.Add(new DbField(Constants.Fields.TimeSetting.AtcomCode) { Value = "AM" });
            inboundTimeFilterDbItem.Fields.Add(new DbField(Constants.Fields.TimeFilter.Time) { Value = morningTimeSlotDbItem.ID.ToString() });

            var eveningTimeSlotDbItem = new DbItem("Evening", ID.NewID);
            eveningTimeSlotDbItem.Fields.Add(new DbField(Constants.Fields.TimeSetting.StartTime) { Value = "20220101T180000Z" });
            eveningTimeSlotDbItem.Fields.Add(new DbField(Constants.Fields.TimeSetting.EndTime) { Value = "20220101T235900Z" });
            eveningTimeSlotDbItem.Fields.Add(new DbField(Constants.Fields.TimeSetting.AtcomCode) { Value = "PM" });
            outboundTimeFilterDbItem.Fields.Add(new DbField(Constants.Fields.TimeFilter.Time) { Value = eveningTimeSlotDbItem.ID.ToString() });

            flightsFiltersDbItem.Add(inboundTimeFilterDbItem);
            flightsFiltersDbItem.Add(outboundTimeFilterDbItem);
            searchFiltersDbItem.Add(flightsFiltersDbItem);
            db.Add(morningTimeSlotDbItem);
            db.Add(eveningTimeSlotDbItem);
            db.Add(searchFiltersDbItem);
            var fakeContext = new FakeSiteContext(
               new Sitecore.Collections.StringDictionary
               {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
               });

            using (new FakeSiteContextSwitcher(fakeContext))
            {
                // Act
                var act = service.GetSearchFilters(db.Database);

                // Assert
                act.Should().NotBeNull();
                act.FlightFilters.Should().NotBeEmpty();
                act.FlightFilters.ElementAt(0).Code.Should().Be(inbound.Code);
                act.FlightFilters.ElementAt(0).Name.Should().Be(inbound.Name);
                act.FlightFilters.ElementAt(1).Code.Should().Be(outbound.Code);
                act.FlightFilters.ElementAt(1).Name.Should().Be(outbound.Name);
                act.FlightFilters.ElementAt(0).TimeSlots.Should().ContainSingle();
                act.FlightFilters.ElementAt(0).TimeSlots.ElementAt(0).AtcomCode.Should().Be("AM");
                act.FlightFilters.ElementAt(0).TimeSlots.ElementAt(0).TrackingId.Should().Be("Inbound morning");
                act.FlightFilters.ElementAt(0).TimeSlots.ElementAt(0).StartTime.Should().NotBeNullOrEmpty();
                act.FlightFilters.ElementAt(0).TimeSlots.ElementAt(0).EndTime.Should().NotBeNullOrEmpty();
                act.FlightFilters.ElementAt(1).TimeSlots.Should().ContainSingle();
                act.FlightFilters.ElementAt(1).TimeSlots.ElementAt(0).AtcomCode.Should().Be("PM");
                act.FlightFilters.ElementAt(1).TimeSlots.ElementAt(0).TrackingId.Should().Be("Outbound evening");
            }
        }
    }
}
