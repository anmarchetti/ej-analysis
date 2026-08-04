using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.ComponentTests.Utils;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Seats;

public class SeatsControllerGetSeatsMapTests : BaseFixtureAwareComponentTest
{
    public SeatsControllerGetSeatsMapTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Fact]
    public async Task GetSeatsMap_ReturnsCorrectResult()
    {

        // Arrange
        var expected = ComponentTestUtils.GetJsonString(@"WebApi\seats\get-seats-map\get-seats-map-response.json", minify: true);

        // Act
        var response = await Client.GetAsync("/api/v1.0/seats?DepAirportCode=ALC&ArrAirportCode=LTN&DepartureDate=2024-02-17&FlightNumber=2314&IsOutboundFlight=true");

        // Assert
        var content = await response.Content.ReadAsStringAsync();
        content.Should().BeEqualAfterNormalization<HttpResponseMessage>(expected);
    }
}
