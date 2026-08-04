using AutoFixture.Xunit3;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Account;

/// <summary>
/// Integration tests for <see cref="AccountController"/>
/// </summary>
public class AccountControllerCustomerDetailsTests : BaseFixtureAwareComponentTest
{
    public AccountControllerCustomerDetailsTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account/customer-details")]
    [Theory]
    [InlineAutoData("/api/v1.0/account/customer-details")]
    public async Task CustomerDetails_NotLoggedIn_Unauthorized(string apiUrl)
    {
        // Act
        var response = await Client.GetAsync(apiUrl);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account/customer-details")]
    [Theory]
    [InlineAutoData("/api/v1.0/account/customer-details", "test@easyjet.com", "Qwerty_0")]
    public async Task CustomerDetails_LoggedIn_AllDetails(string apiUrl, string email, string password)
    {
        // Arrange 
        var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "customer_details_test@easyjet.json")));

        // Login first
        var body = JsonConvert.SerializeObject(new
        {
            email,
            password,
            captcha = "uniquetoken"
        });

        var loginResponse = await Client.PostAsync("/api/v1.0/account/login", new StringContent(body, Encoding.UTF8, "application/json"));
        var loginCookies = loginResponse.Headers.GetValues("Set-Cookie");

        var reqMessage = new HttpRequestMessage(HttpMethod.Get, apiUrl);
        reqMessage.Headers.Add(HeaderNames.Cookie, loginCookies);

        // Act
        var response = await Client.SendAsync(reqMessage);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        content.Should().Be(expected);
    }
}