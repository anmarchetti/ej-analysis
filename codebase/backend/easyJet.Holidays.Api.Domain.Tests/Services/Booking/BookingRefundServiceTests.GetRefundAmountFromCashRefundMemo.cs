using easyJet.Holidays.Api.Domain.Data.Booking;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking;

public partial class BookingRefundServiceTests
{
    [Theory]
    [InlineData("RF", "Refund amount is 123.45 USD", 123.45)]
    [InlineData("RF", "Refund amount is 123 USD", 123)]
    [InlineData("RF", "Refund cash amount is 123.67 EUR", 123.67)]
    [InlineData("RF", "Total 1234.98 EUR", 1234.98)]
    public void GetRefundAmountFromCashRefundMemo_RegexMatch_ReturnExpectedValue(string code, string text, decimal expectedValue)
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            Memo =
            [
                new Memo { Code = code, Text = text }
            ]
        };

        // Act
        var result = _sut.GetRefundAmountFromCashRefundMemo(bookingResponse);

        // Assert
        result.Should().Be(expectedValue);
    }

    [Theory]
    [InlineData("RF", "Refund amount is USD")]
    [InlineData("RF", "Refund amount is 123")]
    [InlineData("RF", "Refund cash amount is 123.67EUR")]
    public void GetRefundAmountFromCashRefundMemo_RegexDoesNotMatch_ReturnNull(string code, string text)
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            Memo =
            [
                new Memo { Code = code, Text = text }
            ],
            CancellationDate = DateTime.UtcNow.AddDays(-1).AddMinutes(-1),
            PaymentInfo = new PriceInfo()
            {
                PaymentHistory = [
                    new PaymentHistoryItem()
                    {
                        Amount = 100,
                        PaymentDate = DateTime.UtcNow.AddDays(2),
                    },
                    new PaymentHistoryItem()
                    {
                        Amount = -100,
                        PaymentDate = DateTime.UtcNow.AddDays(-1),
                        RefundAgainstId = "Some Id"
                    }
                ]
            }
        };

        // Act
        var result = _sut.GetRefundAmountFromCashRefundMemo(bookingResponse);

        // Assert
        result.Should().BeNull();
    }
    
    [Fact]
    public void GetRefundAmountFromCashRefundMemo_WhenNoMemo_ReturnExpectedValueFromPaymentHistory()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            CancellationDate = DateTime.UtcNow.AddDays(-1).AddMinutes(-1),
            PaymentInfo = new PriceInfo()
            {
                PaymentHistory = [
                    new PaymentHistoryItem()
                    {
                        Amount = 100,
                        PaymentDate = DateTime.UtcNow.AddDays(2),
                    },
                    new PaymentHistoryItem()
                    {
                        Amount = -100,
                        PaymentDate = DateTime.UtcNow.AddDays(-1),
                        RefundAgainstId = "Some Id"
                    }
                ]
            }
        };

        // Act
        var result = _sut.GetRefundAmountFromCashRefundMemo(bookingResponse);

        // Assert
        result.Should().Be(100);
    }
}