using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.TransferManagementPlatform.Api;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.TransferManagementPlatform.Tests.Api;

public class TransferManagementPlatformApiClientTests
{
    [Fact]
    public void Constructor_ShouldThrowArgumentNullException_WhenSettingsIsNull()
    {
        // Arrange
        var httpClient = new HttpClient();
        var envSettingsMock = new Mock<IOptions<EnvironmentBehaviourSettings>>();

        // Act
#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type.
        Action act = () => new TransferManagementPlatformApiClient(httpClient, envSettingsMock.Object, null);
#pragma warning restore CS8625 // Cannot convert null literal to non-nullable reference type.

        // Assert
        act.Should().Throw<ArgumentNullException>().WithMessage("*settings*");
    }
    
    [Fact]
    public void Constructor_ShouldNotThrow_WhenAllDependenciesAreProvided()
    {
        // Arrange
        var httpClient = new HttpClient();
        var envSettingsMock = new Mock<IOptions<EnvironmentBehaviourSettings>>();
        envSettingsMock.Setup(e => e.Value).Returns(new EnvironmentBehaviourSettings());
        var settingsMock = new Mock<IOptions<TransferManagementPlatformSettings>>();
        settingsMock.Setup(s => s.Value).Returns(new TransferManagementPlatformSettings());

        // Act
        Action act = () => new TransferManagementPlatformApiClient(httpClient, envSettingsMock.Object, settingsMock.Object);

        // Assert
        act.Should().NotThrow();
    }
    
    [Fact]
    public async Task PrepareRequestMessage_ShouldSetApiKeyCorrectly()
    {
        // Arrange
        var httpClient = new HttpClient();
        var envSettingsMock = new Mock<IOptions<EnvironmentBehaviourSettings>>();
        envSettingsMock.Setup(e => e.Value).Returns(new EnvironmentBehaviourSettings());
        var settingsMock = new Mock<IOptions<TransferManagementPlatformSettings>>();
        settingsMock.Setup(s => s.Value).Returns(new TransferManagementPlatformSettings { SecretKey = "very secret" });

        var client = new TransferManagementPlatformApiClient(httpClient, envSettingsMock.Object, settingsMock.Object);
        var request = new HttpRequestMessage();

        // Act
        await client.PrepareRequestMessage(request);

        // Assert
        request.Headers.Should().ContainKey(Consts.ApiKeyHeaderKey);
        request.Headers.TryGetValues(Consts.ApiKeyHeaderKey, out var apiKey).Should().BeTrue();
        apiKey.Should().Contain("very secret");
    }
}