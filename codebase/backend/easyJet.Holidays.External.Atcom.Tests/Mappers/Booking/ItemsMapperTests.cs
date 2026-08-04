using System.Globalization;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.Internal;
using FluentAssertions;
using FluentAssertions.Execution;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Booking;

public class ItemsMapperTests
{
    private readonly TransferSurchargeSettings _surchargeSettings = new()
    {
        SmallSeCode = "SURS",
        SmallSeType = "SPEQS",
        LargeSeCode = "SURL",
        LargeSeType = "SPEQL"
    };

    [Fact]
    public void Map_ReturnsNullTransferSurcharge_WhenNoSurchargeInTheInputData()
    {
        var items = new List<Item>
        {
            new()
            {
                Ser_Sts = new[] { Ser_Sts.FIX },
                St_Dt = "2020-08-11",
                Bkg_Qty = "1"
            }
        };

        var result = ItemsMapper.Map(items, null, _surchargeSettings);

        using (new AssertionScope())
        {
            result.Count.Should().Be(1);
            result[0].SmallSeSurcharge.Should().BeNull();
            result[0].LargeSeSurcharge.Should().BeNull();
        }
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(10, 5)]
    public void Map_ReturnsCorrectTransferSurcharge_WhenSurchargeInTheInputData(decimal smallSeSurcharge, decimal largeSeSurcharge)
    {
        var items = new List<Item>
        {
            new()
            {
                Ser_Sts = new[] { Ser_Sts.FIX },
                St_Dt = "2020-08-11",
                Bkg_Qty = "1",
                Prices = new[]
                {
                    new Price
                    {
                        Prc_Cd = _surchargeSettings.SmallSeCode,
                        Prc_Cd_Tp = _surchargeSettings.SmallSeType,
                        Prc = new Prc_Type { Value = smallSeSurcharge.ToString("N2", CultureInfo.InvariantCulture) }
                    },
                    new Price
                    {
                        Prc_Cd = _surchargeSettings.LargeSeCode,
                        Prc_Cd_Tp = _surchargeSettings.LargeSeType,
                        Prc = new Prc_Type { Value = largeSeSurcharge.ToString("N2", CultureInfo.InvariantCulture) }
                    }
                }
            }
        };

        var result = ItemsMapper.Map(items, null, _surchargeSettings);

        using (new AssertionScope())
        {
            result.Count.Should().Be(1);
            result[0].SmallSeSurcharge.Should().Be(smallSeSurcharge);
            result[0].LargeSeSurcharge.Should().Be(largeSeSurcharge);
        }
    }

    [Fact]
    public void ExtractTransferCode_WithNullCode_ReturnsNull()
    {
        // Act
        var result = ItemsMapper.ExtractTransferCode(null);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void ExtractTransferCode_WithCodeWithoutTildes_ReturnsOriginalCode()
    {
        // Arrange
        var code = "ABCD1234";

        // Act
        var result = ItemsMapper.ExtractTransferCode(code);

        // Assert
        result.Should().Be("ABCD1234");
    }

    [Fact]
    public void ExtractTransferCode_WithCodeContainingTildes_ReturnsPartAfterTildes()
    {
        // Arrange
        var code = "PREFIX~~TRANSFERCODE";

        // Act
        var result = ItemsMapper.ExtractTransferCode(code);

        // Assert
        result.Should().Be("TRANSFERCODE");
    }

    [Fact]
    public void ExtractTransferCode_WithEmptyStringAfterTildes_ReturnsEmptyString()
    {
        // Arrange
        var code = "PREFIX~~";

        // Act
        var result = ItemsMapper.ExtractTransferCode(code);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public void ExtractTransferCode_WithMultipleTildes_ReturnsPartBetweenFirstAndSecondTildes()
    {
        // Arrange
        var code = "A~~B~~C";

        // Act
        var result = ItemsMapper.ExtractTransferCode(code);

        // Assert
        result.Should().Be("B");
    }

    [Fact]
    public void ExtractTransferCode_WithEmptyString_ReturnsEmptyString()
    {
        // Arrange
        var code = "";

        // Act
        var result = ItemsMapper.ExtractTransferCode(code);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public void ExtractTransferCode_WithOnlyTildes_ReturnsEmptyString()
    {
        // Arrange
        var code = "~~";

        // Act
        var result = ItemsMapper.ExtractTransferCode(code);

        // Assert
        result.Should().BeEmpty();
    }
}
