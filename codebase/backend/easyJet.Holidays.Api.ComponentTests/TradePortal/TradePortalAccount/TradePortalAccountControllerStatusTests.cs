using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalAccount;

public class TradePortalAccountControllerStatusTests : BaseTradeFixtureAwareComponentTest
{
    private const string ApiRoute = "/api/v1.0/trade-portal/account/status";

    public TradePortalAccountControllerStatusTests(TradePortalWebApplicationFixture tradeWebApp) : base(tradeWebApp)
    {
    }

    [Fact]
    public async Task StatusEndpointWithoutCookie_ShouldReturnFalse()
    {
        // Arrange
        var client = CreateClient();

        // Act
        var response = await client.GetAsync(ApiRoute);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Be("{}");
    }

    [Fact]
    public async Task StatusEndpointWithCookie_ShouldReturnStatusObject()
    {
        // Arrange

        // Act
        var response = await Client.GetAsync(ApiRoute);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync())?["signedIn"];
        content!["number"]?.GetValue<string>().Should().Be("12346");
        content["name"]?.GetValue<string>().Should().Be("QWE");
    }
}