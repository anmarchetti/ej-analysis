using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using FluentAssertions.Execution;
using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalSearch;

public class TradePortalBookingSearchControllerSimpleSearchTests : BaseTradeFixtureAwareComponentTest
{
    private const string ApiRoute = "/api/v1.0/trade-portal/booking/search/simple?bookingReference=";
    private const string ValidReference = "VALID_REF";

    public TradePortalBookingSearchControllerSimpleSearchTests(TradePortalWebApplicationFixture tradeWebApp) : base(tradeWebApp)
    {
    }

    [Fact]
    public async Task SimpleSearch_ShouldReturnUnauthorized()
    {
        // Arrange
        var client = CreateClient();

        // Act
        var response = await client.GetAsync($"{ApiRoute}{ValidReference}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SimpleSearchWithNotExistingId_ShouldReturnNotFound()
    {
        // Arrange

        // Act
        var response = await Client.GetAsync($"{ApiRoute}IdDoesNotExist");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-300030");
        responseContent["error"]?.GetValue<string>().Should().Be("Can not get booking");
        responseContent["innerErrors"]?.AsArray()[0]?["code"]!.GetValue<string>().Should().Be("E0755");
    }

    [Fact]
    public async Task SimpleSearchExistingBookingOfAnotherUser_ShouldReturnForbidden()
    {
        // Arrange

        // Act
        var response = await Client.GetAsync($"{ApiRoute}NoPermission");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        responseContent!["code"]!.GetValue<string>().Should().Be("API-ERR-300030");
        responseContent["error"]!.GetValue<string>().Should().Be("Can not get booking");
        responseContent["innerErrors"]!.AsArray()[0]?["code"]?.GetValue<string>().Should().Be("E14121");
    }

    [Fact]
    public async Task SimpleSearchExistingBookingIsIgnoredBySettings_ShouldReturnNotFound()
    {
        // Arrange

        // Act
        var response = await Client.GetAsync($"{ApiRoute}IgnoredBySettings");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData("111k11al1111v111111111111111111")]
    [InlineData("1235*5")]
    public async Task SimpleSearchWithInvalidParameter_ShouldReturnBadRequest(string invalidReference)
    {
        // Arrange

        // Act
        var response = await Client.GetAsync($"{ApiRoute}{invalidReference}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
    }

    [Fact]
    public async Task SimpleSearchWithValidParameter_ShouldFindBooking()
    {
        // Arrange

        // Act
        var response = await Client.GetAsync($"{ApiRoute}{ValidReference}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        responseContent!["bookingReference"]?.GetValue<string>().Should().Be(ValidReference);
        responseContent["package"]?["accom"]?["hotel"]?["name"]?.GetValue<string>().Should().Be("Majorca Atcore Test Accom");
        responseContent["hotel"]?["name"]?.GetValue<string>().Should().Be("Majorca Atcore Test Accom");
        responseContent["specialRequests"].Should().NotBeNull();
        responseContent["memo"].Should().NotBeNull();
    }

    [Fact]
    public async Task SimpleSearch_ValidBookingWithDefaultLuggage_ReturnsComplimentaryOnlyExtraLuggage()
    {
        // Arrange
            
        // Act
        var response = await Client.GetAsync($"{ApiRoute}VALID_DEFAULT_LUGGAGE");
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());

        // Assert
        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            responseContent?["extraLuggageInfo"]?["items"]?.AsArray().Should().HaveCount(6);
        }
    }
}