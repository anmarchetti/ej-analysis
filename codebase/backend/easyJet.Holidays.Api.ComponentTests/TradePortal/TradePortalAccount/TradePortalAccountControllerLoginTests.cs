using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using System.Text.Json.Nodes;
using Xunit;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalAccount;

public class TradePortalAccountControllerLoginTests : BaseTradeFixtureAwareComponentTest
{
    public TradePortalAccountControllerLoginTests(TradePortalWebApplicationFixture tradeWebApp) : base(tradeWebApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking")]
    [Theory]
    [InlineAutoData("!2345", "password", "123")]
    [InlineAutoData("12", "password", "123")]
    [InlineAutoData("1234567", "password", "123")]
    [InlineAutoData("CZ", "password", "123")]
    [InlineAutoData("A", "password", "123")]
    [InlineAutoData(null, "password", "123")]
    [InlineAutoData("", "password", "123")]
    [InlineAutoData("123", "password", "")]
    [InlineAutoData("", "password", "")]

    public async Task Login_Validate_InvalidRequestArguments(string agentNumber, string password, string agentRef)
    {
        // Arrange
        const string apiUrl = "/api/v1.0/trade-portal/account/login";
        var body = JsonConvert.SerializeObject(new
        {
            Number = agentNumber,
            Password = password,
            Ref = agentRef
        });

        var message = new HttpRequestMessage(HttpMethod.Post, apiUrl);
        message.Content = new StringContent(body, Encoding.UTF8, "application/json");

        // Act
        var response = await Client.SendAsync(message);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        content!["code"]?.GetValue<string>().Should().Be(ApiExceptionCodes.InvalidModelState.Code);
        content["error"]?.GetValue<string>().Should().Be(ApiExceptionCodes.InvalidModelState.Description);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/trade-portal/account/login")]
    [Theory]
    [InlineAutoData("12346", "1020", "Ute Heinemann")]
    [InlineAutoData("12346", "1020", "Benat Haradze")]
    [InlineAutoData("12346", "1020", "Oliver Svensson")]

    public async Task LoginValidRequestArguments_ShouldLogin(string agentNumber, string password, string agentRef)
    {
        // Arrange
        const string apiUrl = "/api/v1.0/trade-portal/account/login";
        var body = JsonConvert.SerializeObject(new
        {
            Number = agentNumber,
            Password = password,
            Ref = agentRef
        });

        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "tradeAgent", "TradeAgentLoginResponse_12346.json")));

        var message = new HttpRequestMessage(HttpMethod.Post, apiUrl);
        message.Content = new StringContent(body, Encoding.UTF8, "application/json");

        // Act
        var response = await Client.SendAsync(message);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cookies = response.Headers.GetValues("Set-Cookie").ToList();
        cookies.Should().Contain(c => c.StartsWith("eJTradePortalSession"));
        cookies.Should().Contain(c => c.StartsWith("eJTradePortalSessionExpiration"));
        content.Should().Be(expectedResponse);
    }

    [Fact]
    public async Task LoginNotExist_ValidRequestArguments()
    {
        // Arrange
        const string apiUrl = "/api/v1.0/trade-portal/account/login";
        var body = JsonConvert.SerializeObject(new
        {
            Number = "p9999",
            Password = "1020",
            Ref = "Benat Haradze"
        });

        var message = new HttpRequestMessage(HttpMethod.Post, apiUrl);
        message.Content = new StringContent(body, Encoding.UTF8, "application/json");

        // Act
        var response = await Client.SendAsync(message);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var contentObject = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        contentObject!["error"]?.GetValue<string>().Should().Be("Can not validate agent, internal server error");
        contentObject["code"]?.GetValue<string>().Should().Be("API-ERR-3100001");
    }
}