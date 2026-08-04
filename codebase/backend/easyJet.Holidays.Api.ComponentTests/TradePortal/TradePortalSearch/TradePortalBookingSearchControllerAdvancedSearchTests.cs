using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalSearch;

public class TradePortalBookingSearchControllerAdvancedSearchTests : BaseTradeFixtureAwareComponentTest
{
    private const string ApiRoute = "/api/v1.0/trade-portal/booking/search/advanced";

    public TradePortalBookingSearchControllerAdvancedSearchTests(TradePortalWebApplicationFixture tradeWebApp) : base(tradeWebApp)
    {
    }

    [Fact]
    public async Task AdvancedSearchWithoutCookieSpecified_ShouldReturnUnauthorized()
    {
        // Arrange
        var client = CreateClient();

        // Act
        var response = await client.GetAsync($"{ApiRoute}?HolidayEnd=2023-02-11");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AdvancedSearchWithEmptyRequest_ShouldReturnBadRequest()
    {
        // Arrange

        // Act
        var response = await Client.GetAsync(ApiRoute);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        responseContent!["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
    }

    [Fact]
    public async Task AdvancedSearchWithValidRequestEmptyCollection_ShouldReturnResults()
    {
        // Arrange

        // Act
        var response = await Client.GetAsync($"{ApiRoute}?HolidayEnd=2023-02-11");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AdvancedSearchWithValidRequestEmptyCollection_ShouldReturnNotFound()
    {
        // Arrange

        // Act
        var response = await Client.GetAsync($"{ApiRoute}?HolidayStart=2025-02-11");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AdvancedSearchWithInvalidSessionId_ShouldReturnBadRequest()
    {
        // Arrange

        // Act
        var response = await Client.GetAsync($"{ApiRoute}?HolidayStart=2021-01-15&SearchSessionId=e9e51b15-6ded-4fb9-b106-9d9643a9e08d@0");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-300034");
        responseContent["error"]?.GetValue<string>().Should().Be("Atcom search session has expired. Please, update the session id");
    }
}