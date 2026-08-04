using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.ApplePay.Api;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.ApplePay.Tests.Api;

public class ApplePayApiServiceTests
{
    [Fact]
    public void Constructor_ShouldThrowArgumentNullException_WhenApplePaySettingsIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new ApplePayApiService(null, null));
    }
    
    [Fact]
    public void Constructor_ShouldThrowArgumentNullException_WhenPaymentMethodsSettingsApplePayIsNull()
    {
        // Arrange
        var optionsMock = new Mock<IOptions<PaymentMethodsSettings>>();
        optionsMock.Setup(o => o.Value).Returns(new PaymentMethodsSettings { ApplePay = null });

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new ApplePayApiService(null, optionsMock.Object));
    }

    [Fact]
    public void Name_ReturnApplePayProxyClientName()
    {
        // Arrange
        var optionsMock = new Mock<IOptions<PaymentMethodsSettings>>();
        optionsMock.Setup(o => o.Value).Returns(new PaymentMethodsSettings { ApplePay = new ApplePaySettings() });
        var httpContextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        httpContextAccessorMock.Setup(h => h.HttpContext).Returns(new DefaultHttpContext() { TraceIdentifier = Guid.NewGuid().ToString() });
        ApplePayApiService applePayApiService = new (null, optionsMock.Object);

        // Act
        string name = applePayApiService.Name();

        // Assert
        Assert.Equal("ApplePay Proxy client.", name);
    }
}