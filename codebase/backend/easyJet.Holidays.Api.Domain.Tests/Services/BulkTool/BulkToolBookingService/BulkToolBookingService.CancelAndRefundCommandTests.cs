#nullable enable
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Tests.Services.Booking;
using FluentAssertions;
using Moq;
using System.Collections.Generic;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.BulkToolBookingService
{
    public class CancelAndRefundCommandTests : BulkToolBookingServiceTests
    {
        [Theory]
        [InlineData("100001", 456)]
        public async Task BulkToolBookingService_ShouldCancelAndRefundBooking_IfBookingCancelledAndPaymentsDataIsValid(string reference, int amount)
        {
            // Arrange 
            _messagesSettings.Object.Value.SuccessfullyCancelledAndRefunded = "Successfully cancelled and refunded";

            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.CancelAndRefundCommand,
                    Reference = reference
                }
            };

            var priceInfo = new PriceInfo();
            priceInfo.PaymentHistory = new[]
                {
                    new PaymentHistoryItem()
                    {
                        Amount = amount
                    }
                };

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Booking,
                BookingReference = reference,
                PaymentInfo = priceInfo,
                Currency = Currency.GBP
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            var paymentsResponse = new BookingRefundResponse()
            {
                Payment = new PaymentHistoryItem()
                {
                    Amount = amount
                }
            };

            _bookingRepository.Setup(x => x.CancelBooking(reference, It.IsAny<string>(), true, It.IsAny<IList<string>>())).ReturnsAsync(() =>
            {
                booking.BookingStatus = _statusesSettings.Value.Canceled;

                return booking;
            });
            _bookingRepository.Setup(x => x.GetBookingMemo(reference)).ReturnsAsync([]);
            _bookingPaymentsService.Setup(x => x.RefundNonCreditPayments(booking)).ReturnsAsync(() =>
            {
                booking.PaymentInfo.PaymentHistory.ToList().ForEach(x =>
                {
                    x.Amount = 0;
                });

                return [paymentsResponse];
            });

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().BeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(_messagesSettings.Object.Value.SuccessfullyCancelledAndRefunded);
            booking.BookingStatus.Should().Be(_statusesSettings.Value.Canceled);
            booking.PaymentInfo.PaymentHistory.ElementAt(0).Amount.Should().Be(0);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.CancelBooking(reference, It.IsAny<string>(), true, It.IsAny<IList<string>>()));
            _bookingPaymentsService.Verify(x => x.RefundNonCreditPayments(booking));
        }

        [Theory]
        [InlineData("100001")]
        public async Task BulkToolBookingService_ShouldFailedCancellation_IfCancelThrowsError(string reference)
        {
            // Arrange 
            _messagesSettings.Object.Value.FailedToCancel = "Failed to cancel";

            var request = new BulkToolRequest()
            {
                Booking = new ()
                {
                    Flag = _commandsSettings.CancelAndRefundCommand,
                    Reference = reference
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Booking,
                BookingReference = reference
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);


            _bookingRepository.Setup(x => x.CancelBooking(reference, It.IsAny<string>(), true, It.IsAny<IList<string>>())).Throws(new Exception(_messagesSettings.Object.Value.FailedToCancel));

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(_messagesSettings.Object.Value.FailedToCancel);
            booking.BookingStatus.Should().Be(_statusesSettings.Value.Booking);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.CancelBooking(reference, It.IsAny<string>(), true, It.IsAny<IList<string>>()));
        }
    }
}
