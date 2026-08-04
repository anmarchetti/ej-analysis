using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Csat.Models;
using easyJet.Holidays.External.Csat.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.External.Csat.Tests;
public class CsatServiceTests
{
    private readonly Mock<IApiService> _apiServiceMock;
    private readonly CsatService _csatService;
    private readonly Mock<IOptions<CsatSettings>> _csatSettingsMock;

    public CsatServiceTests()
    {
        _apiServiceMock = new Mock<IApiService>();
        _csatSettingsMock = new Mock<IOptions<CsatSettings>>();
        _csatSettingsMock.Setup(settings => settings.Value).Returns(new CsatSettings
        {
            CsatUrl = new Uri("https://csat-api.example.com")
        });

        _csatService = new CsatService(_apiServiceMock.Object, _csatSettingsMock.Object);
    }

    [Fact]
    public async Task CheckMarketingEmailConsent_ReturnsTrue_WhenConsentIsGiven()
    {
        // Arrange
        var email = "test@example.com";

        _apiServiceMock
            .Setup(api => api.GetResponseContentAsync<EmailConsentRequest, EmailConsentResponse>(It.IsAny<EmailConsentRequest>()))
            .ReturnsAsync(new EmailConsentResponse { Payload = new JsonApiPayload<bool> { Body = true } });

        // Act
        var result = await _csatService.CheckMarketingEmailConsent(email);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task CheckMarketingEmailConsent_ReturnsFalse_WhenConsentIsNotGiven()
    {
        // Arrange
        var email = "test@example.com";

        _apiServiceMock
            .Setup(api => api.GetResponseContentAsync<EmailConsentRequest, EmailConsentResponse>(It.IsAny<EmailConsentRequest>()))
            .ReturnsAsync(new EmailConsentResponse { Payload = new JsonApiPayload<bool> { Body = false } });

        // Act
        var result = await _csatService.CheckMarketingEmailConsent(email);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task CheckMarketingEmailConsent_ReturnsFalse_WhenApiResponseIsNull()
    {
        // Arrange
        var email = "test@example.com";

        _apiServiceMock
            .Setup(api => api.GetResponseContentAsync<EmailConsentRequest, EmailConsentResponse>(It.IsAny<EmailConsentRequest>()))!
            .ReturnsAsync((EmailConsentResponse)null!);

        // Act
        var result = await _csatService.CheckMarketingEmailConsent(email);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task UnsubscribeEmail_ReturnsTrue_WhenUnsubscribeSucceeds()
    {
        // Arrange
        var email = "unsubscribe@example.com";
        _apiServiceMock
            .Setup(api => api.GetResponseContentAsync<EmailUnsubscribeRequest, EmailUnsubscribeResponse>(It.IsAny<EmailUnsubscribeRequest>()))
            .ReturnsAsync(new EmailUnsubscribeResponse());

        // Act
        var result = await _csatService.UnsubscribeEmail(email);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task UnsubscribeEmail_ReturnsFalse_WhenUnsubscribeFails()
    {
        // Arrange
        var email = "unsubscribe@example.com";
        _apiServiceMock
            .Setup(api => api.GetResponseContentAsync<EmailUnsubscribeRequest, EmailUnsubscribeResponse>(It.IsAny<EmailUnsubscribeRequest>()))!
            .ReturnsAsync((EmailUnsubscribeResponse)null!);

        // Act
        var result = await _csatService.UnsubscribeEmail(email);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task UnsubscribeEmail_ThrowsArgumentNullException_WhenEmailIsNullOrWhitespace()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _csatService.UnsubscribeEmail(null!));
        await Assert.ThrowsAsync<ArgumentNullException>(() => _csatService.UnsubscribeEmail(""));
        await Assert.ThrowsAsync<ArgumentNullException>(() => _csatService.UnsubscribeEmail(" "));
    }
}