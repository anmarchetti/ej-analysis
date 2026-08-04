using AutoFixture.Xunit3;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Account;

/// <summary>
/// Component tests for <see cref="AccountController"/>
/// </summary>
public class AccountControllerCustomerExistsTests : BaseFixtureAwareComponentTest
{
    public AccountControllerCustomerExistsTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account/exists")]
    [Theory]
    [InlineAutoData("Valid email", "test@easyjet.com", HttpStatusCode.OK)]
    [InlineAutoData("No email", "", HttpStatusCode.BadRequest)]
    public async Task CustomerExists_ValidateRequest(string because, string email, HttpStatusCode status)
    {
        // Arrange 
        var apiUrl = $"/api/v1.0/account/exists?email={email}";

        // Act
        var response = await Client.GetAsync(apiUrl);

        // Assert            
        response.StatusCode.Should().Be(status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account/exists")]
    [Theory]
    [InlineAutoData("Customer exists, but locked", "/api/v1.0/account/exists?email=locked@easyjet.com", "true")]
    [InlineAutoData("Customer exists, but password is not correct", "/api/v1.0/account/exists?email=passincorrect@easyjet.com", "true")]
    [InlineAutoData("Customer does not exist", "/api/v1.0/account/exists?email=emailnotexist@easyjet.com", "false")]
    public async Task CustomerExists_ValidateEmail(string because, string apiUrl, string expected)
    {
        // Act
        var response = await Client.GetAsync(apiUrl);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        content.Should().Be(expected, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account/exists")]
    [Theory]
    [InlineAutoData("Customer exists, but locked by sitecore settings", "/api/v1.0/account/exists?email=lockedBysitecore@easyjet.com", HttpStatusCode.Forbidden)]
    [InlineAutoData("Customer exists, account is not locked by sitecore settings", "/api/v1.0/account/exists?email=test@easyjet.com", HttpStatusCode.OK)]
    public async Task CustomerExists_LockedBySitecore(string because, string apiUrl, HttpStatusCode status)
    {
        // Act
        var response = await Client.GetAsync(apiUrl);

        // Assert
        response.StatusCode.Should().Be(status, because);
    }
}