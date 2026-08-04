using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Services.BulkTool.Commands
{
    /// <summary>
    /// Modify booking memo command
    /// </summary>
    public class ModifyMemoCommand : IBulkToolCommand
    {
        private readonly BulkToolSettings _bulkToolSettings;
        private readonly ILogger<ModifyMemoCommand> _logger;
        private readonly IBookingRepository _bookingRepository;
        private readonly MessagesSettings _messagesSettings;

        public ModifyMemoCommand(
            IBookingRepository bookingRepository,
            IOptions<BulkToolSettings> bulkToolSettings,
            ILogger<ModifyMemoCommand> logger
            )
        {
            _bookingRepository = bookingRepository;
            _logger = logger;

            _bulkToolSettings = bulkToolSettings.Value ?? throw new ArgumentNullException(nameof(bulkToolSettings));
            _messagesSettings = _bulkToolSettings.Messages ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
        }

        /// <summary>
        /// Add memo action
        /// </summary>
        /// <param name="booking">Booking object.</param>
        /// <param name="request">Request model</param>
        /// <param name="correlationId">Correlation id</param>
        /// <returns>Result object.</returns>
        public async Task<BulkToolResponse> Invoke(BookingResponse booking, BulkToolRequest request, string correlationId)
        {
            var reference = request.Booking.Reference;
            var memoCode = request.Booking.MemoCode;
            var memoDescription = request.Booking.MemoDescription;

            var result = new BulkToolResponse();
            try
            {
                if (string.IsNullOrEmpty(memoCode) || string.IsNullOrEmpty(memoDescription))
                {
                    throw new ApiException(ApiExceptionCodes.BookingModifyMemo);
                }

                await _bookingRepository.ModifyMemo(reference, new BookingMemo()
                {
                    Code = memoCode,
                    Description = memoDescription
                });
                result.Message = _messagesSettings.MemoAdded;
                result.Reference = reference;
                _logger.LogInformation("{Memo} to {Reference}", _messagesSettings.MemoAdded, reference);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add {MemoDescription} to code {MemoCode}", memoDescription, memoCode);
                result.Message = _messagesSettings.FailedToAddMemo;
                result.Reference = reference;
                result.CorrelationId = correlationId;
                result.Note = $"Failed to add {memoDescription} to code {memoCode}";
                return result;
            }
        }
    }
}
