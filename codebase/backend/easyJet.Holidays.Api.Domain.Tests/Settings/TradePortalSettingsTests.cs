using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Settings;

public class TradePortalSettingsTests
{
    [Fact]
    public void AttachedFileSettings_MaxFileCount_ShouldHaveDefaultValue()
    {
        // Arrange
        var settings = new AttachedFileSettings();

        // Act
        var maxFileCount = settings.MaxFileCount;

        // Assert
        maxFileCount.Should().Be(5);
    }
    [Fact]
    public void AttachedFileSettings_MaxFileSize_ShouldHaveDefaultValue()
    {
        // Arrange
        var settings = new AttachedFileSettings();

        // Act
        var maxFileSize = settings.MaxFileSize;

        // Assert
        maxFileSize.Should().Be(10485760);
    }

    [Fact]
    public void AttachedFileSettings_AllowedFileExtensions_ShouldHaveDefaultValue()
    {
        // Arrange
        var settings = new AttachedFileSettings();

        // Act
        var allowedFileExtensions = settings.AllowedFileExtensions;

        // Assert
        allowedFileExtensions.Should().BeEquivalentTo("application/pdf,image/jpeg,image/png");
    }
    
    [Fact]
    public void AttachedFileSettings_MaxFileCount_ShouldSetValue()
    {
        // Arrange
        var settings = new AttachedFileSettings();

        // Act
        settings.MaxFileCount = 10;

        // Assert
        settings.MaxFileCount.Should().Be(10);
    }

    [Fact]
    public void AttachedFileSettings_MaxFileSize_ShouldSetValue()
    {
        // Arrange
        var settings = new AttachedFileSettings();

        // Act
        settings.MaxFileSize = 20971520;

        // Assert
        settings.MaxFileSize.Should().Be(20971520);
    }

    [Fact]
    public void AttachedFileSettings_AllowedFileExtensions_ShouldSetValue()
    {
        // Arrange
        var settings = new AttachedFileSettings();

        // Act
        settings.AllowedFileExtensions = ".docx,.xlsx";

        // Assert
        settings.AllowedFileExtensions.Should().Be(".docx,.xlsx");
    }
}