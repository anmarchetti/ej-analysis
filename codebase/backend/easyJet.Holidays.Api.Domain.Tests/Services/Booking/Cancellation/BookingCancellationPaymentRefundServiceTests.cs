using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.ObjectModel;
using Xunit;
using BookingRefundResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingRefundResponse;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation
{
    public class BookingCancellationPaymentRefundServiceTests
    {
        private readonly BookingCancellationPaymentRefundService _sut;

        private readonly Mock<IBookingRefundService> _bookingRefundService =
            new();

        private readonly Mock<ILogger<BookingCancellationPaymentRefundService>>
            _logger = new();

        public BookingCancellationPaymentRefundServiceTests()
        {
            _sut = new BookingCancellationPaymentRefundService(_bookingRefundService.Object,
                _logger.Object);
        }

        [Fact]
        public async Task RefundPaymentAmount_RefundOptionIsCredit_ZeroCashRefund()
        {
            // Arrange
            BookingResponse bookingResponse = new()
            {
                Guests =
                [
                    new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
                ],
                LeadPassenger = new LeadPassenger { Email = "email@email.com", },
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes =
                        [
                            new Route { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                        ]
                    }
                }
            };

            BookingCancellationRefundBreakdown refundBreakdown = new() { OriginalBookingValue = 0, };
            var bookingCancellationRefundOption = BookingCancellationRequestRefundOption.Credit;


            // Act
            var result =
                await _sut.RefundPaymentAmount(bookingResponse, bookingCancellationRefundOption, refundBreakdown);

            // Assert
            result.Count.Should().Be(0);
        }

        [Fact]
        public async Task RefundPaymentAmount_RefundOptionIsOriginalPayment_CashRefundAmountIsZero_ZeroCashRefund()
        {
            // Arrange
            BookingResponse bookingResponse = new()
            {
                Guests =
                [
                    new PersonWithDetails { FirstName = "FirstName", LastName = "LastName", IsLead = true }
                ],
                LeadPassenger = new LeadPassenger { Email = "email@email.com", },
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes =
                        [
                            new Route { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                        ]
                    }
                }
            };

            BookingCancellationRefundBreakdown refundBreakdown =
                new() { CashRefundAmount = 0, OriginalBookingValue = 0, };
            var bookingCancellationRefundOption = BookingCancellationRequestRefundOption.OriginalPayment;


            // Act
            var result =
                await _sut.RefundPaymentAmount(bookingResponse, bookingCancellationRefundOption, refundBreakdown);

            // Assert
            result.Count.Should().Be(0);
        }

        [Fact]
        public async Task RefundPaymentAmount_RefundOptionIsOriginalPayment_CashRefundAmountIs100()
        {
            // Arrange
            BookingResponse bookingResponse = new()
            {
                Guests =
                [
                    new PersonWithDetails { FirstName = "FirstName", LastName = "LastName", IsLead = true }
                ],
                LeadPassenger = new LeadPassenger { Email = "email@email.com", },
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes =
                        [
                            new Route { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                        ]
                    }
                }
            };

            BookingCancellationRefundBreakdown refundBreakdown =
                new() { CashRefundAmount = 100, OriginalBookingValue = 0, };
            var bookingCancellationRefundOption = BookingCancellationRequestRefundOption.OriginalPayment;

            _bookingRefundService.Setup(x => x.Refund(bookingResponse, refundBreakdown.CashRefundAmount))
                .ReturnsAsync([
                    new BookingRefundResponse { Payment = new PaymentHistoryItem() { Amount = 100, } }
                ]);

            // Act
            var result =
                await _sut.RefundPaymentAmount(bookingResponse, bookingCancellationRefundOption, refundBreakdown);

            // Assert
            result.Sum(x => x.Payment?.Amount ?? 0).Should().Be(100);
        }

        [Fact]
        public async Task RollbackRefundAmount_NoRefunds_ReturnTrue()
        {
            // Arrange
            BookingResponse bookingResponse = new()
            {
                Guests =
                [
                    new PersonWithDetails { FirstName = "FirstName", LastName = "LastName", IsLead = true }
                ],
                LeadPassenger = new LeadPassenger { Email = "email@email.com", },
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes =
                        [
                            new Route { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                        ]
                    }
                }
            };

            var refunds = new ReadOnlyCollection<BookingRefundResponse> (new List<BookingRefundResponse>());

            // Act
            var result = await _sut.RollbackRefundAmount(bookingResponse, refunds);

            // Assert
            result.Should().Be(true);
        }

    }
}