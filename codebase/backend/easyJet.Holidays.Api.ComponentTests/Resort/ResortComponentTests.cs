using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Models.Poi;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Microsoft.AspNetCore.Http.Extensions;
using Newtonsoft.Json;
using System.Globalization;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Resort;

/// <summary>
/// Component tests for <see cref="ResortController"/>
/// </summary>
public class ResortComponentTests : BaseFixtureAwareComponentTest
{
    public ResortComponentTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/resort/getpois")]
    [Fact]
    public async Task GetPoi_WithMatchingResort_RetrievesAdjacentPointsOfInterest()
    {
        // Arrange
        var builder = new QueryBuilder
        {
            { "resortId", "CYPFLA" },
            { "categories", "Nature,Amenities"},
            { "lat", 34.82787.ToString(CultureInfo.InvariantCulture)},
            { "lon", 32.38956.ToString(CultureInfo.InvariantCulture)}
        };

        // Act
        var response = await Client.GetAsync("/api/v1.0/resort/getpois" + builder);
        var responseContent = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<List<PoiByCategory>>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNullOrEmpty();
        result.Should().Contain(element => element.Category == "Amenities")
            .Which.Items.Should().NotBeEmpty("the bar is just 150 or so meters away");
        result.Should().Contain(element => element.Category == "Nature")
            .Which.Items.Should().BeEmpty("the waterfall is too far away (~15km).");
    }
}