using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Tests.Services.Booking;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.BulkToolBookingService
{
    public class ModifyMemoCommandTests : BulkToolBookingServiceTests
    {

        [Theory]
        [InlineData("100001", ":BC", "memo description text 1")]
        public async Task BulkToolBookingService_ShouldFailedToAddMemo_IfMemoThrowsException(string reference, string memoCode, string memoDescription)
        {
            // Arrange 
            _messagesSettings.Object.Value.FailedToAddMemo = "Failed to add memo";
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Reference = reference,
                    Flag = _commandsSettings.ModifyMemoCommand,
                    MemoCode = memoCode,
                    MemoDescription = memoDescription
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Booking,
                BookingReference = reference
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            _bookingRepository.Setup(x => x.ModifyMemo(reference, It.Is<BookingMemo>(y => y.Code == memoCode && y.Description == memoDescription))).Throws(new Exception());

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(_messagesSettings.Object.Value.FailedToAddMemo);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.ModifyMemo(reference, It.Is<BookingMemo>(y => y.Code == memoCode && y.Description == memoDescription)));
        }

        [Theory]
        [InlineData("100001", null, null)]
        [InlineData("100001", ":BC", null)]
        [InlineData("100001", null, "Simple text")]
        public async Task BulkToolBookingService_ShouldThrowException_IfMemoCodeOrMemoDescriptionIsNullOrEmpty(string reference, string memoCode, string memoDescription)
        {
            // Arrange 
            _messagesSettings.Object.Value.FailedToAddMemo = "Failed to add memo";
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Reference = reference,
                    Flag = _commandsSettings.ModifyMemoCommand,
                    MemoCode = memoCode,
                    MemoDescription = memoDescription
                }
            };
            var booking = new BookingResponse()
            {
                BookingReference = reference,
                BookingStatus = "BOOKING"
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(reference);
            act.Message.Should().Be($"Failed to add memo");
        }

        [Theory]
        [InlineData("100001", ":BC", "memo description text 1")]
        public async Task BulkToolBookingService_ShouldPassModifyMemoCommand_IfMemoValid(string reference, string memoCode, string memoDescription)
        {
            // Arrange 
            _messagesSettings.Object.Value.MemoAdded = "Memo added";

            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.ModifyMemoCommand,
                    Reference = reference,
                    MemoCode = memoCode,
                    MemoDescription = memoDescription
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Booking,
                BookingReference = reference,
            };

            var bookingMemo = new BookingMemo()
            {
                Code = memoCode,
                Description = memoDescription
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            _bookingRepository.Setup(x => x.ModifyMemo(reference, bookingMemo));

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().BeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(_messagesSettings.Object.Value.MemoAdded);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.ModifyMemo(reference, It.Is<BookingMemo>(y => y.Code == memoCode && y.Description == memoDescription)));
        }
    }
}
