using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalAccount;

public class TradePortalAccountControllerLogoutTests : BaseTradeFixtureAwareComponentTest
{
    public TradePortalAccountControllerLogoutTests(TradePortalWebApplicationFixture tradeWebApp) : base(tradeWebApp)
    {
    }

    [Fact]
    public async Task Logout_ShouldLogout()
    {
        // Arrange
        const string expectedHeader = "eJTradePortalSession=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=localhost; path=/; secure; samesite=lax; httponly";

        // Act
        var response = await Client.PostAsync("/api/v1.0/trade-portal/account/logout", new StringContent(""));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.GetValues("Set-Cookie").Should().Contain(expectedHeader);
    }
}