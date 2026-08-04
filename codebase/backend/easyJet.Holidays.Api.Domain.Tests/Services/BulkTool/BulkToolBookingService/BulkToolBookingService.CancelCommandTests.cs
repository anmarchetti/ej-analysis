#nullable enable
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Tests.Services.Booking;
using FluentAssertions;
using Moq;
using System.Collections.Generic;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.BulkToolBookingService
{
    public class CancelCommandTests : BulkToolBookingServiceTests
    {
        [Theory]
        [InlineData("100001")]
        public async Task BulkToolBookingService_ShouldCancelBooking_IfBookingExistsAndNotCancelled(string reference)
        {
            // Arrange 
            const string successfullyCancelledMessage = "Successfully canceled.";

            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.CancelCommand,
                    Reference = reference
                }
            };

            _messagesSettings.Object.Value.SuccessfullyCancelled = successfullyCancelledMessage;

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Booking,
                BookingReference = reference
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);
            _bookingRepository.Setup(x => x.CancelBooking(reference, It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>())).ReturnsAsync(() =>
            {
                booking.BookingStatus = _statusesSettings.Value.Canceled;
                return booking;
            });

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().BeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(successfullyCancelledMessage);
            booking.BookingStatus.Should().Be(_statusesSettings.Value.Canceled);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.CancelBooking(reference, It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>()));
        }

        [Theory]
        [InlineData("100001")]
        public async Task BulkToolBookingService_ShouldNotCancelledBooking_IfBookingCanNotBeCancelled(string reference)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.CancelCommand,
                    Reference = reference
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Canceled,
                BookingReference = reference
            };

            var expectedException = new BookingCancellationException(
                ApiExceptionCodes.BookingCancelError,
                _messagesSettings.Object.Value.BookingAlreadyCanceled,
                reference,
                [
                    new ApiError()
                    {
                        Code = _bookingCodesSettings.Object.Value.BookingAlreadyCanceled,
                        Message = _messagesSettings.Object.Value.BookingAlreadyCanceled
                    }
                ],
                new Exception(_messagesSettings.Object.Value.BookingAlreadyCanceled
                ));

            _bookingRepository.Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);
            _bookingRepository.Setup(x => x.CancelBooking(reference, It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>())).Throws(expectedException);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(_messagesSettings.Object.Value.BookingAlreadyCanceled);
            booking.BookingStatus.Should().Be(_statusesSettings.Value.Canceled);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.CancelBooking(reference, It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>()));
        }
    }
}
