using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Settings;
using FluentAssertions;
using Moq;
using System.Collections.ObjectModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking;

public partial class BookingRefundServiceTests
{
    [Fact]
    public async Task Refund_ShouldThrowArgumentOutOfRangeException_WhenAmountToRefundIsGreaterThanAvailableAmount()
    {
        // Arrange
        var booking = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>
                {
                    new PaymentHistoryItem { Amount = 100, RefundableAmount = 50 }
                }.ToArray()
            }
        };
        decimal amountToRefund = 200;

        // Act
        Func<Task> act = async () => await _sut.Refund(booking, amountToRefund);

        // Assert
        await act.Should().ThrowAsync<ArgumentOutOfRangeException>()
            .WithMessage("Amount to refund is bigger than available card payments (Parameter 'amountToRefund')");
    }

    [Fact]
    public async Task Refund_ShouldReturnBookingRefundResponses_WhenRefundIsSuccessful()
    {
        // Arrange
        var booking = new BookingResponse
        {
            Currency = Currency.GBP,
            BookingReference = "ABC123",
            LeadPassenger = new LeadPassenger { Email = "test@example.com" },
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>
                {
                    new PaymentHistoryItem
                    {
                        PayId = "Pay1",
                        Amount = 100,
                        RefundableAmount = 100,
                        AuthCode = "Auth123",
                        CurIso = "GBP"
                    }
                }.ToArray()
            }
        };
        decimal amountToRefund = 100;

        // Mock the RefundPayment method
        _paymentsServiceMock
            .Setup(s => s.RefundPayment(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<decimal>(),
                It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new RefundPaymentResponse { PaymentId = "Refund1", Result = "Success", Status = "Success" });

        // Mock AddCreditPaymentInfo method
        _bookingPaymentsRepositoryMock
            .Setup(r => r.AddCreditPaymentInfo(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<PaymentHistoryItem>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<LeadPassenger>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IList<string>>()))
            .ReturnsAsync(new BookingResponse { PaymentInfo = new PriceInfo() { PaymentHistory = [] } });

        // Act
        var result = await _sut.Refund(booking, amountToRefund);

        // Assert
        result.Should().BeEquivalentTo(new List<BookingRefundResponse>
        {
            new BookingRefundResponse
            {
                Payment = new PaymentHistoryItem
                {
                    Amount = 100m,
                    RefundableAmount = 100m,
                    PayId = "Pay1",
                    AuthCode = "Auth123",
                    CurIso = "GBP"
                },
                PaymentId = "Refund1"
            }
        });
    }

    [Fact]
    public async Task RollbackRollbackRefund_PaymentRollbackIsSuccessful_ShouldReturnTrue()
    {
        // Arrange
        var booking = new BookingResponse
        {
            BookingReference = "ABC123",
            LeadPassenger = new LeadPassenger { Email = "test@example.com" },
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>
                {
                    new PaymentHistoryItem
                    {
                        PayId = "Pay1",
                        Amount = 100,
                        RefundableAmount = 100,
                        AuthCode = "Auth123",
                        CurIso = "GBP"
                    }
                }.ToArray()
            }
        };

        // Mock the RefundPayment method
        _paymentsServiceMock
            .Setup(s => s.CancelPayment(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new CancelPaymentResponse());

        List<BookingRefundResponse> refunds = booking.PaymentInfo.PaymentHistory.Select(i => new BookingRefundResponse()
        {
            Payment = i, 
            Exception = null, 
            PaymentId = i.PayId
        }).ToList();

#pragma warning disable CA2201
        var exception = new Exception("Test Exception");
#pragma warning restore CA2201

        // Act
        var result = await _sut.RollbackRefund(booking, new ReadOnlyCollection<BookingRefundResponse>(refunds), exception);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task RollbackRollbackRefund_PaymentRollbackFails_ShouldReturnFalse()
    {
        // Arrange
        var booking = new BookingResponse
        {
            BookingReference = "ABC123",
            LeadPassenger = new LeadPassenger { Email = "test@example.com" },
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>
                {
                    new PaymentHistoryItem
                    {
                        PayId = "Pay1",
                        Amount = 100,
                        RefundableAmount = 100,
                        AuthCode = "Auth123",
                        CurIso = "GBP"
                    }
                }.ToArray()
            }
        };

        // Mock the RefundPayment method
        _paymentsServiceMock
            .Setup(s => s.CancelPayment(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
#pragma warning disable CA2201
            .ThrowsAsync(new Exception());
#pragma warning restore CA2201

        List<BookingRefundResponse> refunds = booking.PaymentInfo.PaymentHistory.Select(i => new BookingRefundResponse()
        {
            Payment = i,
            Exception = null,
            PaymentId = i.PayId
        }).ToList();

        // Act
        var result = await _sut.RollbackRefund(booking, new ReadOnlyCollection<BookingRefundResponse>(refunds));

        // Assert
        result.Should().BeFalse();
    }
}