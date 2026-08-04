using Allure.Xunit.Attributes;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Offers;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.TradePortal;

[AllureSuite("TradePortal Account tests")]
public class AccountTests : BaseTest
{
    public AccountTests(
        IHttpClientFactory _httpClientFactory,
        TestApiHttpClient testApiHttpClient,
        ITestOutputHelper testOutputHelper)
        : base(_httpClientFactory, testApiHttpClient, testOutputHelper)
    {
    }

    [Fact]
    public async Task Authentication_RequestSearchWithValidToken_ResponseOk()
    {
        // Arrange
        var auth = await GetTradePortalAuthToken() ?? throw new Exception("Cannot obtain auth token");
        var faker = new GetPackagesRequestFaker();
        var searchRequest = faker.Generate();

        // Act
        var response = await searchApi.GetTradePortalPackages(searchRequest, auth.AccessToken);

        // Assert
        auth.Should().NotBeNull();
        auth.AccessToken.Should().NotBeNull();
        response.Should().NotBeNull();
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Authentication_RequestSearchWithInvalidToken_ResponseUnauthorized()
    {
        // Arrange
        var invalidToken = GenerateInvalidToken();
        var faker = new GetPackagesRequestFaker();
        var searchRequest = faker.Generate();

        // Act
        var response = await searchApi.GetTradePortalPackages(searchRequest, invalidToken);

        // Assert
        response.Should().NotBeNull();
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private static string GenerateInvalidToken()
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("YourSecretKeyHereYourSecretKeyHereYourSecretKeyHere"));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
                new Claim(JwtRegisteredClaimNames.Sub, "your_username"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

        var token = new JwtSecurityToken(
            issuer: "your_issuer",
            audience: "your_audience",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
