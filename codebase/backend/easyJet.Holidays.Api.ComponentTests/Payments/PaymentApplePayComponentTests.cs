using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net;
using System.Text;
using Xunit;


namespace easyJet.Holidays.Api.ComponentTests.Payments;

/// <summary>
/// Component tests for <see cref="PaymentApplePayController"/>
/// </summary>
public class PaymentApplePayComponentTests : BaseFixtureAwareComponentTest
{
    public PaymentApplePayComponentTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/payment/apple-pay/session")]
    [Fact]
    public async Task GetApplePaySession_WithValidRequest_ReturnsSessionObject()
    {
        // Arrange
        var requestBody = new
        {
            validationUrl = "https://apple-pay-gateway-cert.apple.com/paymentservices/startSession",
            requestDomain = "holidays.easyjet.com"
        };

        // Act
        var response = await Client.PostAsync(
            "/api/v1.0/payment/apple-pay/session",
            new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json")
        );

        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<JObject>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();
        result!["merchantSessionIdentifier"].Should().NotBeNull();
        result["displayName"].Should().NotBeNull();
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/payment/apple-pay/session")]
    [Fact]
    public async Task GetApplePaySession_WithMissingValidationUrl_ReturnsBadRequest()
    {
        // Arrange
        var requestBody = new
        {
            requestDomain = "holidays.easyjet.com"
        };

        // Act
        var response = await Client.PostAsync(
            "/api/v1.0/payment/apple-pay/session",
            new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json")
        );

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
