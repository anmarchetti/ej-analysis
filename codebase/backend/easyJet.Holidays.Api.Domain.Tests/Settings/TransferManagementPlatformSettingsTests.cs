using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Settings;

public class TransferManagementPlatformSettingsTests
{

    [Fact]
    public void Properties_ShouldAllowSettingAndGettingValues()
    {
        // Arrange
        var apiSettings = new TransferManagementApiSettings
        {
            BookingTransferDetails = "https://api.example.com/transfer/details"
        };

        var settings = new TransferManagementPlatformSettings
        {
            Host = "https://api.example.com",
            Api = apiSettings
        };

        // Act & Assert
        settings.Host.Should().Be("https://api.example.com");
        settings.Api.Should().NotBeNull();
        settings.Api.BookingTransferDetails.Should().Be("https://api.example.com/transfer/details");
    }
}

public class TransferManagementApiSettingsTests
{
    [Fact]
    public void BookingTransferDetails_ShouldAllowSettingAndGettingValue()
    {
        // Arrange
        var apiSettings = new TransferManagementApiSettings();
        var expectedValue = "https://api.example.com/transfer/details";

        // Act
        apiSettings.BookingTransferDetails = expectedValue;

        // Assert
        apiSettings.BookingTransferDetails.Should().Be(expectedValue);
    }
}