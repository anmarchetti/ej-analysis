using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Extensions;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Tests.Extensions;

public class ServiceCollectionSettingsExtensionsTests
{
    private readonly ServiceProvider _serviceProvider;

    public ServiceCollectionSettingsExtensionsTests()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
            .Build();
        ServiceCollection services = new();

        ServiceCollectionSettingsExtensions.ConfigureSettings(services, configuration);
        _serviceProvider = services.BuildServiceProvider();
    }
    
    [Fact]
    public void ConfigureSettings_PaymentsSettings()
    {
        // Act
        PaymentsSettings paymentSettings = _serviceProvider.GetRequiredService<IOptions<PaymentsSettings>>().Value;

        // Assert
        paymentSettings.MakePayment.Host.Should().NotBeNullOrEmpty();
        paymentSettings.MakePayment.Path.Should().NotBeNullOrEmpty();

        paymentSettings.CancelPayment.Host.Should().NotBeNullOrEmpty();
        paymentSettings.CancelPayment.Path.Should().NotBeNullOrEmpty();

        paymentSettings.RefundPayment.Host.Should().NotBeNullOrEmpty();
        paymentSettings.RefundPayment.Path.Should().NotBeNullOrEmpty();

        paymentSettings.ApiKey.Should().NotBeNullOrEmpty();
        paymentSettings.CustomerServiceUrl.Should().NotBeNullOrEmpty();
        paymentSettings.ThreeDSCallbackHost.Should().NotBeNullOrEmpty();
        paymentSettings.IdentifyNotificationUrl.Should().NotBeNullOrEmpty();
        paymentSettings.ChallengeNotificationUrl.Should().NotBeNullOrEmpty();
        paymentSettings.ThreeDSOneNotificationUrl.Should().NotBeNullOrEmpty();
        paymentSettings.FrontendOrigin.Should().NotBeNullOrEmpty();
        paymentSettings.XPosId.Should().NotBeNullOrEmpty();
        paymentSettings.XPosIdRefund.Should().NotBeNullOrEmpty();
        paymentSettings.Channel.Should().NotBeNullOrEmpty();
        paymentSettings.RefundChannel.Should().NotBeNullOrEmpty();
        paymentSettings.CallbackTemplate.Should().NotBeNullOrEmpty();

        paymentSettings.Api.TimeoutMilliSeconds.Should().NotBe(0);

        paymentSettings.XInspection.Should().NotBeNullOrEmpty();

        paymentSettings.ErrorCodes.Fingerprint.Should().NotBeNullOrEmpty();
        paymentSettings.ErrorCodes.Challenge.Should().NotBeNullOrEmpty();
        paymentSettings.ErrorCodes.Authentication.Should().NotBeNullOrEmpty();
    }
    
    [Fact]
    public void ConfigureSettings_PaymentMethodsSettings()
    {
        // Act
        PaymentMethodsSettings paymentMethodsSettings = _serviceProvider.GetRequiredService<IOptions<PaymentMethodsSettings>>().Value;

        // Assert
        paymentMethodsSettings.ApplePay.DisplayName.Should().NotBeNullOrEmpty();
        paymentMethodsSettings.ApplePay.ApplePayMerchantValidatorProxyHost.Should().NotBeNullOrEmpty();
        paymentMethodsSettings.ApplePay.MerchantValidationPath.Should().NotBeNullOrEmpty();
    }   
}