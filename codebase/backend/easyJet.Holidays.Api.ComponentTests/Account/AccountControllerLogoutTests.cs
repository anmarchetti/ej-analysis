using AutoFixture.Xunit3;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Account;

/// <summary>
/// Component tests for <see cref="AccountController"/>
/// </summary>
public class AccountControllerLogoutTests : BaseFixtureAwareComponentTest
{
    public AccountControllerLogoutTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account/logout")]
    [Theory]
    [InlineAutoData("/api/v1.0/account/logout")]
    public async Task Logout_ClearsDACookies(string apiUrl)
    {
        // Arrange
        // Act
        var response = await Client.PostAsync(apiUrl, new StringContent("", Encoding.UTF8, "application/json"));
        var cookies = response.Headers.GetValues("Set-Cookie").ToList();

        // Assert
        cookies.FirstOrDefault(x => x == "eJ2Session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=localhost; path=/; secure; samesite=lax; httponly").Should().NotBeNull();
        cookies.FirstOrDefault(x => x == "eJExpires=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=localhost; path=/; secure; samesite=lax; httponly").Should().NotBeNull();
    }
}