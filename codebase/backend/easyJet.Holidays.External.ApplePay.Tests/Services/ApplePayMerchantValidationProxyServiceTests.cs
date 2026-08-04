using easyJet.Holidays.Api.Domain.Exceptions.Payment;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.ApplePay.Api;
using easyJet.Holidays.External.ApplePay.Models;
using easyJet.Holidays.External.ApplePay.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using Newtonsoft.Json.Linq;
using System.Net;
using Xunit;

namespace easyJet.Holidays.External.ApplePay.Tests.Services;

public class ApplePayMerchantValidationProxyServiceTests
{
    private readonly ApplePayMerchantValidationProxyService _service;

    private readonly Mock<HttpMessageHandler> _handlerMock;

    private readonly Mock<ApplePayApiService> applePayApiService;
    
    public ApplePayMerchantValidationProxyServiceTests()
    {
        var applePaySettings = new ApplePaySettings
        {
            DisplayName = "Test Merchant",
            ApplePayMerchantValidatorProxyHost = "https://test.easyjet.com",
            MerchantValidationPath = "/api/payment/v1/applepay/merchantvalidation",
            Api = new ApplePayApiSettings { TimeoutMilliSeconds = 60 }
        };

        var paymentMethodsSettings = new PaymentMethodsSettings { ApplePay = applePaySettings };
        var optionsMock = new Mock<IOptions<PaymentMethodsSettings>>();
        optionsMock.Setup(o => o.Value).Returns(paymentMethodsSettings);
        var httpContextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        httpContextAccessorMock.Setup(h => h.HttpContext).Returns(new DefaultHttpContext() { TraceIdentifier = Guid.NewGuid().ToString() });

        _handlerMock = new Mock<HttpMessageHandler>();
        HttpClient httpClient = new (_handlerMock.Object);
        ApplePayApiClient applePayClient = new (httpClient, Options.Create(new EnvironmentBehaviourSettings()), httpContextAccessorMock.Object);
        applePayApiService = new (applePayClient, optionsMock.Object);

        _service = new ApplePayMerchantValidationProxyService(optionsMock.Object, applePayApiService.Object);
    }
    
    [Fact]
    public void Constructor_ShouldThrowArgumentNullException_WhenPaymentMethodsSettingsIsNull()
    {
        // Arrange
        var apiServiceMock = new Mock<IApiService>();

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new ApplePayMerchantValidationProxyService(null, apiServiceMock.Object));
    }

    [Fact]
    public void Constructor_ShouldThrowArgumentNullException_WhenApiServiceIsNull()
    {
        // Arrange
        var paymentMethodsSettings = new PaymentMethodsSettings { ApplePay = new ApplePaySettings() };
        var optionsMock = new Mock<IOptions<PaymentMethodsSettings>>();
        optionsMock.Setup(o => o.Value).Returns(paymentMethodsSettings);

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new ApplePayMerchantValidationProxyService(optionsMock.Object, null));
    }
    
    [Fact]
    public async Task GetSessionObject_ReturnsValidSession_WhenSuccessful()
    {
        // Arrange: Mock the API response
        string requestDomain = "example.com";
        Uri validationUrl = new("https://apple-pay-validation.example.com");
        var mockedSession = new JObject
        {
            ["epochTimestamp"] = 123456789,
            ["expiresAt"] = 123456999,
            ["merchantSessionIdentifier"] = "Session123",
            ["nonce"] = "Nonce123",
            ["merchantIdentifier"] = "Merchant123",
            ["domainName"] = "example.com",
            ["displayName"] = "Test Merchant",
            ["signature"] = "Signature123",
            ["operationAnalyticsIdentifier"] = "Analytics123",
            ["pspId"] = "PSP123",
            ["retries"] = 3
        };
        
        ApplePayGetSessionResponse response = new()
        {
            Payload =
            {
                Body = mockedSession
            }
        };

        applePayApiService
            .Setup(service =>
                service.GetResponseContentAsync<ApplePayGetSessionRequest, ApplePayGetSessionResponse>(
                    It.IsAny<ApplePayGetSessionRequest>()))
            .ReturnsAsync(response);
        
        // Act
        var result = await _service.GetSessionObject(validationUrl, requestDomain);

        // Assert Response
        Assert.NotNull(result);
        Assert.Equal(123456789, result["epochTimestamp"]);
        Assert.Equal("Session123", result["merchantSessionIdentifier"]);
        Assert.Equal("Nonce123", result["nonce"]);
        Assert.Equal("Merchant123", result["merchantIdentifier"]);
    }

    [Fact]
    public async Task GetSessionObject_ThrowsException_WhenServerReturnsError()
    {
        // Arrange: Mock the API to return a 500 error
        using var response = new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.InternalServerError,
        };
        _handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(response);
        
        // Act & Assert
        ApplePayProxyException exception = await Assert.ThrowsAsync<ApplePayProxyException>(
            () => _service.GetSessionObject(new Uri("https://apple-pay-validation.example.com"), "example.com"));
        Assert.Contains("Error during Apple Pay Merchant Validation Proxy Service", exception.Message, StringComparison.InvariantCulture);
    }
}