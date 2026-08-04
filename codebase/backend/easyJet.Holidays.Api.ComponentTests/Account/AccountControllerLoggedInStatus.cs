using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Account
{
    /// <summary>
    /// Component tests for <see cref="AccountController"/>
    /// </summary>
    public class AccountControllerLoggedInStatus : BaseComponentTest
    {
        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/account/status")]
        [Theory]
        [InlineAutoData("/api/v1.0/account/status", "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;", "{\"signedIn\":true}")]
        [InlineAutoData("/api/v1.0/account/status", "eJ2Session=;", "{\"signedIn\":false}")]
        [InlineAutoData("/api/v1.0/account/status", "null", "{\"signedIn\":false}")]
        public async Task CustomerDetails_LoggedIn_AllDetails(string apiUrl, string cookie, string expected)
        {
            // Arrange 
            var message = new HttpRequestMessage(HttpMethod.Get, apiUrl);
            message.Headers.Add(HeaderNames.Cookie, cookie);

            var statusResponse = await Client.SendAsync(message);

            // Act
            var content = await statusResponse.Content.ReadAsStringAsync();

            // Assert
            content.Should().Be(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/account/status")]
        [Fact]
        public async Task CustomerDetailsOnTradePortalWithValidCookie_LoggedIn_ShouldReturnFalse()
        {
            // Arrange 
            ApplyConfigurationField("EnvironmentBehaviour:IsTradePortal", "true");
            // setting both auth cookies to simmulate, that user has both logged into default site and trade portal
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJTradePortalSession=dafcd5fd09df93b3be4e3b3cb44d8797; expires=Fri, 04 Oct 7022 15:37:45 GMT; domain=.easyjet.com; path=/; secure; samesite=lax; httponly");

            var statusResponse = await Client.GetAsync("/api/v1.0/account/status");
            // Act
            var content = JsonSerializer.Deserialize<JsonNode>(await statusResponse.Content.ReadAsStringAsync());

            // Assert
            content!["signedIn"]?.GetValue<bool>().Should().BeFalse();
        }
    }
}
