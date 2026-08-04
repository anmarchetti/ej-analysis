using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.TransferManagementPlatform.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.TransferManagementPlatform.Tests.Services;

public class EndpointsProviderTests
{
    [Fact]
    public void Enum_ShouldContainExpectedValues()
    {
        // Assert
        ((int)TransferManagementEndpoint.BookingTransferDetails).Should().Be(0);
    }

    [Fact]
    public void Enum_ShouldHaveCorrectNames()
    {
        // Assert
        TransferManagementEndpoint.BookingTransferDetails.ToString().Should().Be("BookingTransferDetails");
    }
    
    [Fact]
    public void GetEndpoint_ShouldReturnCorrectUri()
    {
        // Arrange
        var transferManagementSettingsMock = new Mock<IOptions<TransferManagementPlatformSettings>>();
        transferManagementSettingsMock.Setup(s => s.Value).Returns(new TransferManagementPlatformSettings
        {
            Host = "https://api.example.com",
            Api = new TransferManagementApiSettings
            {
                BookingTransferDetails = "/transfer/details"
            }
        });

        var envBehaviorSettingsMock = new Mock<IOptions<EnvironmentBehaviourSettings>>();
        envBehaviorSettingsMock.Setup(e => e.Value).Returns(new EnvironmentBehaviourSettings());
        var cookiesServiceMock = new Mock<ICookiesService>();
        var loggerMock = new Mock<ILogger<EndpointsProvider>>();

        var provider = new EndpointsProvider(
            transferManagementSettingsMock.Object,
            envBehaviorSettingsMock.Object,
            cookiesServiceMock.Object,
            loggerMock.Object
        );

        // Act
        var uri = provider.GetEndpoint(TransferManagementEndpoint.BookingTransferDetails);

        // Assert
        uri.Should().Be(new Uri("https://api.example.com/transfer/details"));
    }
}