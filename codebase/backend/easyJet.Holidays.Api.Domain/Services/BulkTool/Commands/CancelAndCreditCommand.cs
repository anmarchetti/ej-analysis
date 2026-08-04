using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Services.BulkTool.Commands
{
    /// <inheritdoc/>
    public class CancelAndCreditCommand : IBulkToolCommand
    {
        private readonly IVouchersService _vouchersService;
        private readonly BulkToolSettings _bulkToolSettings;
        private readonly StatusesSettings _statusesSettings;
        private readonly CancelAndCreditSettings _cancelAndCreditSettings;
        private readonly BulkToolActions _actions;
        private readonly ILogger<BulkToolBookingService> _logger;
        private readonly IBookingRepository _bookingRepository;
        private readonly VoucherSettings _voucherSettings;
        private readonly IBookingRefundEligibleService _bookingRefundEligibleService;

        /// <summary>
        /// Initialize services and settings for bulk tool service.
        /// </summary>
        /// <param name="vouchersService">Vouchers service.</param>
        /// <param name="bulkToolSettings">Bulk tool settings.</param>
        /// <param name="logger">Bulk tool service logger.</param>
        public CancelAndCreditCommand(
            IVouchersService vouchersService,
            IOptions<BulkToolSettings> bulkToolSettings,
            IOptions<ApiSettings> apiSettings,
            IBookingRepository bookingRepository,
            ILogger<BulkToolBookingService> logger,
            BulkToolActions actions,
            IBookingRefundEligibleService bookingRefundEligibleService
            )
        {
            _vouchersService = vouchersService;
            _logger = logger;
            _actions = actions;
            _bookingRepository = bookingRepository;
            _bookingRefundEligibleService = bookingRefundEligibleService;

            try
            {
                _bulkToolSettings = bulkToolSettings.Value ?? throw new ArgumentNullException(nameof(bulkToolSettings));
                _statusesSettings = _bulkToolSettings.Statuses ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _cancelAndCreditSettings = _bulkToolSettings.CancelAndCredit ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _voucherSettings = apiSettings?.Value?.Vouchers ?? throw new ArgumentNullException(nameof(apiSettings));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot get settings");
                throw;
            }
        }

        /// <summary>
        /// Cancel and credit booking.
        /// </summary>
        /// <param name="booking">Booking object.</param>
        /// <returns>Cancellation and refund response object.</returns>
        public async Task<BulkToolResponse> Invoke(BookingResponse booking, BulkToolRequest request, string correlationId)
        {
            var reference = booking?.BookingReference;
            var command = _actions.GetCommandName(request);
            try
            {
                if (booking != null && booking.BookingStatus != _statusesSettings.Canceled)
                {
                    // booking is not cancelled, try to cancel
                    var result = await _actions.CancelBooking(reference, booking, correlationId);

                    if (result?.Object == null)
                    {
                        _logger.LogWarning("Cannot cancel booking because atcom response has errors. {Msg}", result?.Response?.Message);
                        return result?.Response;
                    }

                    booking.BookingStatus = _statusesSettings.Canceled;
                }

                var bookingPriceInPounds = booking?.PaymentInfo?.PaymentHistory?.Sum(x => x.Amount) ?? 0;

                if (bookingPriceInPounds <= 0)
                {
                    _logger.LogWarning("Cannot credit booking with total price less or equal 0");
                    return new BulkToolResponse() { Message = "Credit failed", Reference = reference, CorrelationId = correlationId, Note = string.Empty };
                }

                var customer = await _actions.GetCustomerByEmailOrCreate(booking?.CustomerDetails?.Email);
                var currency = booking?.Currency.Code;
                var meta = _actions.GetBulkCreditMetadata(request?.Booking?.Memo ?? _cancelAndCreditSettings.DefaultMemo, command, booking?.BookingReference, currency);

                var creditBreakdown = _bookingRefundEligibleService.BuildCreditBreakdown(booking, RefundRules.Regular, new EligibleAction { Credit = bookingPriceInPounds });
                var vouchers = await _vouchersService.AddCreditToBooking(customer.Id, creditBreakdown, _actions.GetId(), booking, meta);

                // And finally add memo "Credited booking"
                var newVouchersString = string.Join(", ", vouchers.Select(x => x.Code).ToArray());
                await _bookingRepository.ModifyMemo(booking?.BookingReference, new BookingMemo
                {
                    Code = _voucherSettings.BookingMemos.MovedToCredit.Code,
                    Description = newVouchersString
                });

                return new BulkToolResponse()
                {
                    Message = "Successfully canceled and credited",
                    Reference = reference,
                    CorrelationId = string.Empty,
                    Note = string.Join(";", vouchers.Select(x => x.Code))
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to credit");
                return new BulkToolResponse() { Message = "Credit failed", Reference = reference, CorrelationId = correlationId, Note = string.Empty };
            }
        }
    }
}
