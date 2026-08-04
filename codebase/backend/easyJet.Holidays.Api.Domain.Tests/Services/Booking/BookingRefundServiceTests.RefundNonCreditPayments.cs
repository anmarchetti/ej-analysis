using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Payment;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking;

public partial class BookingRefundServiceTests
{
    [Fact]
    public async Task RefundNonCreditPayments_WithCreditPayments_RefundOnlyNonCreditItems()
    {
        // Arrange
        var booking = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new[]
                {
                    new PaymentHistoryItem { PayId = "p-20", Amount = 20 },
                    new PaymentHistoryItem { PayId = "p-10", Amount = 10, AuthCode = "123" }
                }
            },
            LeadPassenger = new LeadPassenger { Email = "test@email.com" }
        };

        _paymentsServiceMock.Setup(x => x.RefundPayment(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<decimal>(),
                It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new RefundPaymentResponse { PaymentId = "refund-01" });

        _bookingPaymentsRepositoryMock.Setup(x => x.AddCreditPaymentInfo(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<PaymentHistoryItem>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IList<string>>()))
            .ReturnsAsync(new BookingResponse { PaymentInfo = new PriceInfo { PaymentHistory = [] } });

        // Act
        var result = await _sut.RefundNonCreditPayments(booking);

        // Assert
        _paymentsServiceMock.Verify(x => x.RefundPayment(
            It.IsAny<string>(), It.IsAny<string>(), It.Is<decimal>(p => p == 10), It.IsAny<string>(),
            It.IsAny<string>()
        ), Times.Once);

        _bookingPaymentsRepositoryMock.Verify(x => x.AddCreditPaymentInfo(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<PaymentHistoryItem>(),
            It.Is<string>(p => p == "p-10"), It.Is<string>(p => p == "refund-01"), It.IsAny<LeadPassenger>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IList<string>>()
        ), Times.Once);

        result.Should().BeEquivalentTo(new List<BookingRefundResponse>
        {
            new() { Payment = new PaymentHistoryItem { Amount = 10, PayId = "p-10", AuthCode = "123" } }
        });
    }

    [Fact]
    public async Task RefundNonCreditPayments_WithRefundAgainstId_SkipRefundItems()
    {
        // Arrange
        var booking = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new[]
                {
                    new PaymentHistoryItem
                    {
                        PayId = "p-20", Amount = 20, RefundAgainstId = "p-9999", AuthCode = "1232"
                    },
                    new PaymentHistoryItem { PayId = "p-10", Amount = 10, AuthCode = "1232" }
                }
            },
            LeadPassenger = new LeadPassenger { Email = "test@email.com" }
        };

        _paymentsServiceMock.Setup(x => x.RefundPayment(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<decimal>(),
                It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new RefundPaymentResponse { PaymentId = "refund-01" });

        _bookingPaymentsRepositoryMock.Setup(x => x.AddCreditPaymentInfo(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<PaymentHistoryItem>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IList<string>>()))
            .ReturnsAsync(new BookingResponse { PaymentInfo = new PriceInfo { PaymentHistory = [] } });

        // Act
        var result = await _sut.RefundNonCreditPayments(booking);

        // Assert
        _paymentsServiceMock.Verify(x => x.RefundPayment(
            It.IsAny<string>(), It.IsAny<string>(), It.Is<decimal>(p => p == 10), It.IsAny<string>(),
            It.IsAny<string>()
        ), Times.Once);

        _bookingPaymentsRepositoryMock.Verify(x => x.AddCreditPaymentInfo(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<PaymentHistoryItem>(),
            It.Is<string>(p => p == "p-10"), It.Is<string>(p => p == "refund-01"), It.IsAny<LeadPassenger>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IList<string>>()
        ), Times.Once);

        result.Should().BeEquivalentTo(new List<BookingRefundResponse>
        {
            new() { Payment = new PaymentHistoryItem { Amount = 10, PayId = "p-10", AuthCode = "1232" } }
        });
    }

    [Fact]
    public async Task RefundNonCreditPayments_PartiallyRefunded_RefundRemaining()
    {
        // Arrange
        var booking = new BookingResponse
        {
            BookingReference = "ref",
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new[]
                {
                    new PaymentHistoryItem
                    {
                        PayId = "p-20", Amount = 20, RefundableAmount = 15.57m, AuthCode = "1232"
                    }
                }
            },
            LeadPassenger = new LeadPassenger { Email = "test@email.com" }
        };

        _paymentsServiceMock.Setup(x => x.RefundPayment(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<decimal>(),
                It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new RefundPaymentResponse { PaymentId = "refund-01" });

        _bookingPaymentsRepositoryMock.Setup(x => x.AddCreditPaymentInfo(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<PaymentHistoryItem>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IList<string>>()))
            .ReturnsAsync(new BookingResponse { PaymentInfo = new PriceInfo { PaymentHistory = [] } });

        // Act
        var result = await _sut.RefundNonCreditPayments(booking);

        // Assert
        _paymentsServiceMock.Verify(x => x.RefundPayment(
            It.Is<string>(b => b == "ref"), It.IsAny<string>(), It.Is<decimal>(p => p == (decimal)(15.57)),
            It.IsAny<string>(), It.IsAny<string>()
        ), Times.Once);

        _bookingPaymentsRepositoryMock.Verify(x => x.AddCreditPaymentInfo(
            It.Is<string>(b => b == "ref"), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<PaymentHistoryItem>(),
            It.Is<string>(p => p == "p-20"), It.Is<string>(p => p == "refund-01"), It.IsAny<LeadPassenger>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IList<string>>()
        ), Times.Once);

        result.Should().BeEquivalentTo(new List<BookingRefundResponse>
        {
            new()
            {
                Payment = new PaymentHistoryItem
                {
                    Amount = 15.57m, RefundableAmount = 15.57m, PayId = "p-20", AuthCode = "1232"
                }
            }
        });
    }
}