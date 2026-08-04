using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.ComponentTests.Shared;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using FluentAssertions.Execution;
using System.Net;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Search;

public class SearchControllerPackagesFiltersTests : BaseFixtureAwareComponentTest
{
    public SearchControllerPackagesFiltersTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Theory]
    [InlineData("MT,MTMT", DestinationFilter.RegionVariantFilterName)]
    [InlineData("ES", DestinationFilter.DestinationVariantFilterName)]
    public async Task SearchPackages_DestinationFilterOptions(string destination, string expectedFilterName)
    {
        // Arrange
        // Act
        var response = await Client.GetAsync($"/api/v1.0/search/packages?startDate=2023-06-01&minTemp=0&maxTemp=30&flexibleDays=0&duration[0]=14&departure=LGW,LTN,SEN,STN&geography={destination}&originalGeography={destination}&automaticAllocation=false&room[0].adults=1&room[0].children=0&room[0].infants=0&&&take=10&page=1&freeForKidsOnly=false&searchType=normal&distressedFlightsOnly=false&placementId=hotels_list&destinations[0]=region:MTMT");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = ResponseContentHelper.ReadContent<JsonObject>(response);
        using (new AssertionScope())
        {
            var filters = content["filters"]!.AsArray();
            var destinationFilter = filters.FirstOrDefault(x =>
                x?["code"]!.GetValue<string>() == AvailableFilters.Destination.GetEnumMemberValue());
            destinationFilter!["name"]!.GetValue<string>().Should().Be(expectedFilterName);
        }

    }
}