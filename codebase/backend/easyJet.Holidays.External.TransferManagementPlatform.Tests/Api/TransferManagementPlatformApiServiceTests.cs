using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.TransferManagementPlatform.Api;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.TransferManagementPlatform.Tests.Api;

public class TransferManagementPlatformApiServiceTests
{

    [Fact]
    public void Name_ShouldReturnExpectedValue()
    {
        // Arrange
        var apiClient = CreateApiClient();

        var service = new TransferManagementPlatformApiService(apiClient);

        // Act
        var name = service.Name();

        // Assert
        name.Should().Be("Transfer Management API service.");
    }
    

    private static TransferManagementPlatformApiClient CreateApiClient()
    {
        var httpClient = new HttpClient();
        var envSettingsMock = new Mock<IOptions<EnvironmentBehaviourSettings>>();
        envSettingsMock.Setup(e => e.Value).Returns(new EnvironmentBehaviourSettings());
        var settingsMock = new Mock<IOptions<TransferManagementPlatformSettings>>();
        settingsMock.Setup(s => s.Value).Returns(new TransferManagementPlatformSettings());

        return  new TransferManagementPlatformApiClient(httpClient, envSettingsMock.Object, settingsMock.Object);
    }
}