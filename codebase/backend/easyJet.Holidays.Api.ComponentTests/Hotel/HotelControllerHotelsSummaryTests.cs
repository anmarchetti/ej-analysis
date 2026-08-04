using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Hotel;

/// <summary>
/// Component tests for <see cref="HotelController"/>
/// </summary>
public class HotelControllerHotelsSummaryTests : BaseFixtureAwareComponentTest
{
    public HotelControllerHotelsSummaryTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/hotel/summary/location")]
    [Fact]
    public async Task LocationSearch_NoCode()
    {
        // Arrange 
        const string query = "/api/v1.0/hotel/summary/location?code=";

        // Act
        var response = await Client.GetAsync(query);

        // Assert            
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/hotel/summary/polygon")]
    [Fact]
    public async Task PolygonSearch_Success_ShouldReturnHotels()
    {
        await Client.GetAndValidate(
            $"/api/v1.0/hotel/summary/location?code=ESP",
            "__admin", "files", "WebApi", "hotel-offers", "location_search_ESP.json");
    }
}