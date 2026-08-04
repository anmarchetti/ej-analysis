using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using WireMock.Matchers;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalAccount;

public class TradePortalAccountControllerLoginFaultTests : BaseTradePortalComponentTest
{
    [Fact]
    public async Task LoginAgentNamesCheckTurnedOff_ShouldLogin()
    {
        // Arrange
        var apiUrl = "/api/v1.0/trade-portal/account/login";
        var body = JsonConvert.SerializeObject(new
        {
            Number = "12346",
            Password = "1020",
            Ref = "some name"
        });

        // Configuring via code, because request is being done against exact same route, but it should return different response
        var server = SpawnServer("CmsWireMockServer");
        server.Given(Request.Create()
            .WithPath("/api/Content/ByPath")
            .WithParam("path", new ExactMatcher("{site}/Settings/Allowed Trade Agent Names Settings"))
            .UsingGet())
            .RespondWith(Response.Create()
                .WithHeader("Content-Type", "application/json")
                .WithBody("{\"Enabled\":\"\"}"));
        server.Given(Request.Create()
                .WithPath("/api/Content/ByPath")
                .WithParam("path", new ExactMatcher("{site}/Settings/Session Settings"))
                .UsingGet())
            .RespondWith(Response.Create()
                .WithHeader("Content-Type", "application/json")
                .WithBody("{\"SessionTimeout\":\"45\", \"TimerPopupTimeout\":\"10\"}"));

        ApplyConfigurationField("Cms:Host", server.Url);

        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "tradeAgent", "TradeAgentLoginResponse_12346.json")));

        var message = new HttpRequestMessage(HttpMethod.Post, apiUrl);
        message.Content = new StringContent(body, Encoding.UTF8, "application/json");

        // Act
        var response = await Client.SendAsync(message);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cookies = response.Headers.GetValues("Set-Cookie");
        cookies.Should().Contain(c => c.StartsWith("eJTradePortalSession"));
        cookies.Should().Contain(c => c.StartsWith("eJTradePortalSessionExpiration"));
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Be(expectedResponse);
    }
}