#nullable enable
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Tests.Services.Booking;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.BulkToolBookingService
{
    public class CancelAndCreditCommandTests : BulkToolBookingServiceTests
    {
        [Theory]
        [InlineData("email@email.com", 144, "100001")]
        public async Task BulkToolBookingService_ShouldThorwException_IfCannotGetOrCreateBookingCustomer(string email, int amount, string reference)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.CancelAndCreditCommand,
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
                CustomerDetails = new CustomerDetails()
                {
                    Email = email
                }
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

            _customersRepository.Setup(x => x.GetCustomersByEmail(email, 1)).Throws(new Exception());

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            booking.PaymentInfo.PaymentHistory.ElementAt(0).Amount.Should().Be(amount);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.CancelBooking(reference, It.IsAny<string>(), true, It.IsAny<IList<string>>()));
            _customersRepository.Verify(x => x.GetCustomersByEmail(email, 1));
        }

        [Theory]
        [InlineData("email@email.com", "100001")]
        public async Task BulkToolBookingService_ShouldReturnFailedResponse_IfCancelThrowsExceptionOrWasntCancelled(string email, string reference)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.CancelAndCreditCommand,
                    Reference = reference
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Booking,
                BookingReference = reference,
                CustomerDetails = new CustomerDetails()
                {
                    Email = email
                }
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            var expectedException = new BookingCancellationException(
               ApiExceptionCodes.BookingCancelError,
               _messagesSettings.Object.Value.BookingAlreadyCanceled,
               reference,
               new[]
               {
                    new ApiError()
                    {
                        Code = "123",
                        Message = "AAA"
                    }
               },
               new Exception(_messagesSettings.Object.Value.BookingAlreadyCanceled
               ));

            _bookingRepository.Setup(x => x.CancelBooking(reference, It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>())).Throws(expectedException);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be("Failed to cancel");
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.CancelBooking(reference, It.IsAny<string>(), true, It.IsAny<IList<string>>()));
        }

        [Theory]
        [InlineData("email@email.com", "100001", new[] { 0 })]
        [InlineData("email@email.com", "100001", new[] { -1, 1 })]
        public async Task BulkToolBookingService_ShouldThrowException_IfSumOfBookingPaymentHistoryIsLessOrEqualZero(string email, string reference, int[] paymentHistoryAmounts)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.CancelAndCreditCommand,
                    Reference = reference
                }
            };

            var priceInfo = new PriceInfo();

            priceInfo.PaymentHistory = paymentHistoryAmounts.Select(amount => new PaymentHistoryItem() { Amount = amount }).ToArray();

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Booking,
                BookingReference = reference,
                PaymentInfo = priceInfo,
                CustomerDetails = new CustomerDetails()
                {
                    Email = email
                }
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            _bookingRepository.Setup(x => x.CancelBooking(reference, It.IsAny<string>(), true, It.IsAny<IList<string>>())).ReturnsAsync(() =>
            {
                booking.BookingStatus = _statusesSettings.Value.Canceled;
                return booking;
            });

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Message.Should().Be("Credit failed");
            act.Reference.Should().Be(booking.BookingReference);
            booking.PaymentInfo.PaymentHistory.Sum(x => x.Amount).Should().BeLessOrEqualTo(0);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.CancelBooking(reference, It.IsAny<string>(), true, It.IsAny<IList<string>>()));
        }
    }
}
