using AutoFixture.Xunit3;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Analytics;

/// <summary>
/// Component tests for Analytics. Uses <see cref="AccountController"/> as endpoint to validate 
/// </summary>
public class AnalyticsTests : BaseFixtureAwareComponentTest
{
    public AnalyticsTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    private static string GetCookieValue(string cookieString)
    {
        return cookieString.Split(";")[0].Split("=")[1];
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/logging/log")]
    [Theory]
    [InlineAutoData("/api/v1.0/account/login")]
    public async Task Analytics_AddSessionAndUserCookies(string apiUrl)
    {
        // Arrange 
        var body = JsonConvert.SerializeObject(new { level = "trace", message = "pass" });

        // Act
        var response = await Client.PostAsync(apiUrl, new StringContent(body, Encoding.UTF8, "application/json"));
        var cookies = response.Headers.GetValues("Set-Cookie");
        var sessionCookie = cookies.FirstOrDefault(x => x.Contains("ejHolidaysSessionId="));

        // Assert
        sessionCookie.Should().NotBeNull();

        GetCookieValue(sessionCookie).Should().NotBeNullOrWhiteSpace();
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/logging/log")]
    [Theory]
    [InlineAutoData("/api/v1.0/account/login")]
    public async Task Analytics_LoggedIn_NoUserId(string apiUrl)
    {
        // Arrange 
        var body = JsonConvert.SerializeObject(new { level = "trace", message = "pass" });

        var reqMessage = new HttpRequestMessage(HttpMethod.Post, apiUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };

        reqMessage.Headers.Add(HeaderNames.Cookie, $"eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e3a6aca8c7b03b9615e9c9ba0410e9c9085e321e4cb2f7a489795c200eb5760cf&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var response = await Client.SendAsync(reqMessage);
        var cookies = response.Headers.GetValues("Set-Cookie");
        var userCookie = cookies.FirstOrDefault(x => x.Contains("ejHolidaysUserId="));
        var userId = GetCookieValue(userCookie);

        // Assert
        userId.Should().NotBeNullOrEmpty();
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/logging/log")]
    [Theory]
    [InlineAutoData("/api/v1.0/account/login")]
    public async Task Analytics_NotLoggedIn_NoUserId(string apiUrl)
    {
        // Arrange 
        var body = JsonConvert.SerializeObject(new { level = "trace", message = "pass" });

        var reqMessage = new HttpRequestMessage(HttpMethod.Post, apiUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };

        var response = await Client.SendAsync(reqMessage);
        var cookies = response.Headers.GetValues("Set-Cookie");
        var userCookie = cookies.FirstOrDefault(x => x.Contains("ejHolidaysUserId="));
        var userId = GetCookieValue(userCookie);

        // Assert
        userId.Should().BeNullOrEmpty();
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account/login")]
    [Theory]
    [InlineAutoData("/api/v1.0/account/login")]
    public async Task Analytics_LoggedIn_IdsExists_KeepsIdsBetweenMultipleRequests(string apiUrl)
    {
        // Arrange 
        var expectedSessionId = "afa0f978-d664-48e7-9944-ecdfcede7d68";
        var expectedUserId = "123456";
        var body = JsonConvert.SerializeObject(new { email = "user", password = "pass" });

        var reqMessage = new HttpRequestMessage(HttpMethod.Post, apiUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };

        reqMessage.Headers.Add(HeaderNames.Cookie, $"eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e3a6aca8c7b03b9615e9c9ba0410e9c9085e321e4cb2f7a489795c200eb5760cf&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");
        reqMessage.Headers.Add(HeaderNames.Cookie, $"ejHolidaysUserId={expectedUserId}; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax;");
        reqMessage.Headers.Add(HeaderNames.Cookie, $"ejHolidaysSessionId={expectedSessionId}; expires=Mon, 26 Aug 2019 12:41:26 GMT; domain=localhost; path=/; secure; samesite=lax; httponly");

        var response = await Client.SendAsync(reqMessage);
        var cookies = response.Headers.GetValues("Set-Cookie").ToList();
        var sessionCookie = cookies.FirstOrDefault(x => x.Contains("ejHolidaysSessionId="));
        var userCookie = cookies.FirstOrDefault(x => x.Contains("ejHolidaysUserId="));
        var sessionId = GetCookieValue(sessionCookie);
        var userId = GetCookieValue(userCookie);

        // Assert
        sessionId.Should().Be(expectedSessionId);
        userId.Should().Be(expectedUserId);
    }
}