using easyJet.Holidays.Api.Domain.Settings;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Settings;

public class VoucherifySettingsTests
{
    [Fact]
    public void ShowExpiredAndUsedVouchersInYears_ShouldHaveDefaultValueOfTwo()
    {
        // Arrange
        var settings = new VoucherifySettings();

        // Act
        var defaultValue = settings.ShowExpiredAndUsedVouchersInYears;

        // Assert
        Assert.Equal(2, defaultValue);
    }

    [Fact]
    public void ShowExpiredAndUsedVouchersInYears_ShouldAllowSettingValue()
    {
        // Arrange
        var settings = new VoucherifySettings();
        var expectedValue = 5;

        // Act
        settings.ShowExpiredAndUsedVouchersInYears = expectedValue;

        // Assert
        Assert.Equal(expectedValue, settings.ShowExpiredAndUsedVouchersInYears);
    }
}