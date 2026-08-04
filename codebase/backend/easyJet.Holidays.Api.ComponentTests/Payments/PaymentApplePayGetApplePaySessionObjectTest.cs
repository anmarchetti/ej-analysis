using easyJet.Holidays.Api.Common.Exceptions;
using System.Net;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.ApplePay.Api;
using easyJet.Holidays.External.ApplePay.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json.Linq;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Payments;

public class PaymentApplePayGetApplePaySessionObjectTest
{
    private readonly PaymentApplePayController _controller;
    private readonly Mock<ApplePayApiClient> _applePayApiClientMock;
    private readonly string _applePaySessionJson;

    public PaymentApplePayGetApplePaySessionObjectTest()
    {
        IOptions<PaymentMethodsSettings> paymentMethodsSettings = Options.Create(new PaymentMethodsSettings()
        {
            ApplePay = new ApplePaySettings()
            {
                DisplayName = "ApplePay",
                ApplePayMerchantValidatorProxyHost = "https://applepay-proxy.easyjet.com",
                MerchantValidationPath = "/merchant-validation",
                Api = new ApplePayApiSettings { TimeoutMilliSeconds = 60 }
            }
        });
        
        _applePaySessionJson = """
                               {
                                   "epochTimestamp": 123456789,
                                   "expiresAt": 123456789,
                                   "merchantSessionIdentifier": "MerchantSessionIdentifier",
                                   "nonce": "Nonce",
                                   "merchantIdentifier": "MerchantIdentifier",
                                   "domainName": "DomainName",
                                   "displayName": "DisplayName",
                                   "signature": "Signature",
                                   "operationAnalyticsIdentifier": "OperationAnalyticsIdentifier",
                                   "pspId": "PspId",
                                   "retries": 3
                               }
                               """;
        
        var httpContextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        httpContextAccessorMock.Setup(h => h.HttpContext).Returns(new DefaultHttpContext() { TraceIdentifier = Guid.NewGuid().ToString() });
        _applePayApiClientMock = new Mock<ApplePayApiClient>(null, Options.Create(new EnvironmentBehaviourSettings()), httpContextAccessorMock.Object);
        ApplePayApiService applePayApiService = new (_applePayApiClientMock.Object, paymentMethodsSettings);
        ApplePayMerchantValidationProxyService applePayService = new(paymentMethodsSettings, applePayApiService);
        Mock<ILogger<PaymentApplePayController>> loggerMock = new();

        _controller = new PaymentApplePayController(loggerMock.Object, applePayService);
    }

    [Fact]
    public async Task GetApplePaySession_WithValidData_ReturnsSuccessfulResponse()
    {
        // Arrange
        _applePayApiClientMock.Setup(service => service.MakeCall(
                HttpMethod.Post, 
                It.Is<Uri>(x => x.Equals(new Uri("https://applepay-proxy.easyjet.com/merchant-validation"))),
                It.IsAny<string>(),
                null, 
                It.Is<TimeSpan>(x => x.Equals(TimeSpan.FromMilliseconds(60)))
            ))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(_applePaySessionJson)));
        
        // Act
        ApplePaySessionRequest mockApplePaySessionRequest = new() { RequestDomain = "DomainName", ValidationUrl = new Uri("https://url.com") };
        var applePaySessionResponse = await _controller.GetApplePaySessionObject(mockApplePaySessionRequest);

        // Assert
        Assert.NotNull(applePaySessionResponse);
        var jsonResult = Assert.IsType<JsonResult>(applePaySessionResponse);
        jsonResult.Value.Should().BeEquivalentTo(JObject.Parse(_applePaySessionJson));
    }

    [Fact]
    public async Task GetApplePaySession_ApplePayClientCallFails_ThrowsApiException()
    {
        // Arrange
        _applePayApiClientMock.Setup(service => service.MakeCall(HttpMethod.Post, 
                It.IsAny<Uri>(),
                It.IsAny<string>(),
                null, null))
            .ThrowsAsync(new ApiException(
                ApiExceptionCodes.PaymentError, "Service failure",
                null,
                null,
                HttpStatusCode.InternalServerError
            ));
        
        ApplePaySessionRequest mockApplePaySessionRequest = new() { RequestDomain = "domain", ValidationUrl = new Uri("http://url.com") };
        
        // Act
        var exception = await Assert.ThrowsAsync<ApiException>(() => _controller.GetApplePaySessionObject(mockApplePaySessionRequest));
        
        // Assert
        Assert.Equal(ApiExceptionCodes.ApplePaySessionError, exception.Code);
        Assert.Equal($"Error creating ApplePay Session object for {mockApplePaySessionRequest.RequestDomain}", exception.Message);
        Assert.Equal(HttpStatusCode.InternalServerError, exception.StatusCode);
    }
    
    [Fact]
    public async Task GetApplePaySession_ShouldReturnOk()
    {
        _applePayApiClientMock.Setup(service => service.MakeCall(
                HttpMethod.Post, 
                It.Is<Uri>(x => x.Equals(new Uri("https://applepay-proxy.easyjet.com/merchant-validation"))),
                It.IsAny<string>(),
                null, 
                It.Is<TimeSpan>(x => x.Equals(TimeSpan.FromMilliseconds(60)))
            ))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(_applePaySessionJson)));
        
        // Act
        ApplePaySessionRequest mockApplePaySessionRequest = new() { RequestDomain = "DomainName", ValidationUrl = new Uri("https://url.com") };
        var applePaySessionResponse = await _controller.GetApplePaySessionObject(mockApplePaySessionRequest);

        // Assert
        Assert.NotNull(applePaySessionResponse);
        var jsonResult = Assert.IsType<JsonResult>(applePaySessionResponse);
        jsonResult.Value.Should().BeEquivalentTo(JObject.Parse(_applePaySessionJson));
        jsonResult.StatusCode.Should().Be((int)HttpStatusCode.OK);
    }
}
