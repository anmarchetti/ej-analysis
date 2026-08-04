using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Search;

public class SearchControllerRecommendedOffersTests : BaseFixtureAwareComponentTest
{
    public SearchControllerRecommendedOffersTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Fact]
    public async Task RecommendedOffers_ValidRequest_ShouldFindOffers()
    {
        var query = "api/v1.0/search/recommended?startDate=2025-04-23&flexibleDays=0&duration[0]=2&departure=LGW,LTN,SEN,STN&" +
            "geography=ALL&automaticAllocation=true&room[0].adults=2&room[0].children=0&room[0].infants=0&" +
            "searchType=normal&distressedFlightsOnly=false&placementId=ejh-reco-pdp-book-bottom&" +
            "pageType=Hotel%20Details";

        var response = await Client.GetAsync(query);
        var responseJson = await response.Content.ReadAsStringAsync();
        var searchOffersResponse = JsonConvert.DeserializeObject<SearchOffersResponse>(responseJson);

        searchOffersResponse.Should().NotBeNull();
        searchOffersResponse?.Offers.Should().NotBeNull();
        searchOffersResponse?.Offers.Count.Should().Be(9);
    }
}
