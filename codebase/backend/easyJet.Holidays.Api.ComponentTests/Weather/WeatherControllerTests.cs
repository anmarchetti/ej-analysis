using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Weather;

public class WeatherControllerTests : BaseFixtureAwareComponentTest
{
    public WeatherControllerTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Fact]
    public async Task GetWeatherForRegion_WhenRegionHasWeatherData_ReturnsWeather()
    {
        // Arrange 
        var query = $"/api/v1.0/weather/region?code=ESMJ";

        // Act
        var response = await Client.GetAsync(query);

        // Assert            
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Be(@"{""region"":""ESMJ"",""averageTemp"":[22,21,18,14,11,8,7,8,10,13,16,19],""rainyDays"":[4,3,3,3,4,4,5,6,5,5,4,4]}");
    }

    [Fact]
    public async Task GetWeatherForRegion_WhenRegionDoesntHaveWeatherData_ReturnsNotFound()
    {
        // Arrange 
        var query = $"/api/v1.0/weather/region?code=ABCD";

        // Act
        var response = await Client.GetAsync(query);

        // Assert            
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
    }
}
