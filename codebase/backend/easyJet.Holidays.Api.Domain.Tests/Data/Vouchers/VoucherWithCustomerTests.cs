using easyJet.Holidays.Api.Domain.Data.Vouchers;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests;

public class VoucherWithCustomerTests
{
    [Fact]
    public void LastOperationAt_WhenRedemptionsExist_ReturnsMaxRedemptionDate()
    {
        // Arrange
        var expectedDate = DateTime.UtcNow.AddDays(-2);
        var voucher = new CreditHistoryItem
        {
            Redemptions = new List<CreditHistoryItem>()
            {
                new() { Order = new OrderItem() { Date = DateTime.UtcNow.AddDays(-5) } },
                new() { Order = new OrderItem() { Date = expectedDate } }
            }
        };

        // Act
        var result = voucher.LastOperationAt;

        // Assert
        result.Should().Be(expectedDate);
    }

    [Fact]
    public void LastOperationAt_WhenNoRedemptionsExist_ReturnsCreatedAt()
    {
        // Arrange
        var createdAt = DateTime.UtcNow.AddDays(-10);
        var voucher = new CreditHistoryItem() { CreatedAt = createdAt };

        // Act
        var result = voucher.LastOperationAt;

        // Assert
        result.Should().Be(createdAt);
    }

    [Fact]
    public void Amount_WhenOrderAndRedemptionsExist_ReturnsTotalAmount()
    {
        var voucher = new CreditHistoryItem
        {
            Order = new OrderItem() { Amount = 100 },
            Redemptions = new List<CreditHistoryItem>()
            {
                new() { Order = new OrderItem() { Amount = -50, Date = DateTime.UtcNow.AddDays(-5) } },
                new() { Order = new OrderItem() { Amount = -30, Date = DateTime.UtcNow.AddDays(-2) } }
            }
        };

        // Act
        var result = voucher.Amount;

        // Assert
        result.Should().Be(20);
    }

    [Fact]
    public void Amount_WhenNoOrderOrRedemptions_ReturnsZero()
    {
        // Arrange
        var voucher = new CreditHistoryItem();

        // Act
        var result = voucher.Amount;

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public void Amount_WhenOnlyOrderExists_ReturnsOrderAmount()
    {
        // Arrange
        var voucher = new CreditHistoryItem() { Order = new OrderItem() { Amount = 200 }, };

        // Act
        var result = voucher.Amount;

        // Assert
        result.Should().Be(200);
    }

    [Fact]
    public void Amount_WhenOnlyRedemptionsExist_ReturnsTotalRedemptionAmount()
    {
        var voucher = new CreditHistoryItem
        {
            Redemptions = new List<CreditHistoryItem>()
            {
                new() { Order = new OrderItem() { Amount = 50, Date = DateTime.UtcNow.AddDays(-5) } },
                new() { Order = new OrderItem() { Amount = 30, Date = DateTime.UtcNow.AddDays(-2) } }
            }
        };

        // Act
        var result = voucher.Amount;

        // Assert
        result.Should().Be(80);
    }
}