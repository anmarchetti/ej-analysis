using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Search;

public class SearchControllerFlightExtrasTests : BaseFixtureAwareComponentTest
{
    public SearchControllerFlightExtrasTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Fact]
    public async Task SearchFlightExtras_ReturnsCorrectResult()
    {
        var requestString = ComponentTestUtils.GetJsonString(
            @"WebApi\search\flight-extras\flight-extras-search-request.json");
        var expected = ComponentTestUtils.GetJsonString(
            @"WebApi\search\flight-extras\flight-extras-search-response.json", minify: true);

        var response = await Client.PostAsync(
            "/api/v1.0/search/flight-extras",
            ComponentTestUtils.GetJsonContent(requestString));

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Be(expected);
    }
}