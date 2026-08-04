using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Voucherify.DataModel;

namespace easyJet.Holidays.Api.Domain.Services.BulkTool.Commands
{
    /// <inheritdoc/>
    public class UndoCreditCommand : IBulkToolCommand
    {
        private readonly IVoucherPaymentFlowService _voucherPaymentService;
        private readonly BulkToolSettings _bulkToolSettings;
        private readonly StatusesSettings _statusesSettings;
        private readonly VoucherSettings _voucherSettings;
        private readonly ILogger<UndoCreditCommand> _logger;
        private readonly BulkToolActions _actions;
        private readonly IBookingRefundService _bookingPaymentsService;

        /// <summary>
        /// Initialize services and settings for bulk tool service.
        /// </summary>
        /// <param name="bulkToolSettings">Bulk tool settings.</param>
        /// <param name="logger">Bulk tool service logger.</param>
        public UndoCreditCommand(
            IOptions<ApiSettings> apiSettings,
            IOptions<BulkToolSettings> bulkToolSettings,
            IVoucherPaymentFlowService voucherPaymentService,
            ILogger<UndoCreditCommand> logger,
            BulkToolActions actions,
            IBookingRefundService bookingPaymentsService
            )
        {
            _logger = logger;
            _voucherPaymentService = voucherPaymentService;
            _actions = actions;
            _bookingPaymentsService = bookingPaymentsService;
            _voucherSettings = apiSettings?.Value?.Vouchers ?? throw new ArgumentNullException(nameof(_voucherSettings));
            _bulkToolSettings = bulkToolSettings.Value ?? throw new ArgumentNullException(nameof(bulkToolSettings));
            _statusesSettings = _bulkToolSettings.Statuses ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
        }

        /// <summary>
        /// Undo credit. Process doesnt start if:
        /// - booking is not cancelled
        /// - balance is not zero (should be cancelled and credited)
        /// - no card payments to refund
        /// - no credits to undo 
        /// 
        /// Method is idempotent and can be run multiple times 
        /// </summary>
        /// <param name="booking">Booking object.</param>
        /// <returns>Cancellation and refund response object.</returns>
        public async Task<BulkToolResponse> Invoke(BookingResponse booking, BulkToolRequest request, string correlationId)
        {
            var reference = booking?.BookingReference;
            BulkToolResponse ErrorResponse(string msg) => new BulkToolResponse() { Message = msg, Reference = reference, CorrelationId = correlationId, Note = string.Empty };
            if (booking == null)
            {
                return ErrorResponse("Booking is null");
            }

            try
            {
                // Validate booking 
                if (booking.BookingStatus != _statusesSettings.Canceled)
                {
                    return ErrorResponse("Booking is not cancelled");
                }

                var paymentHistory = booking?.PaymentInfo?.PaymentHistory;
                if (paymentHistory == null)
                {
                    return ErrorResponse("No payments");
                }

                var bookingPriceInPounds = paymentHistory.Sum(x => x.Amount);
                if (bookingPriceInPounds != 0)
                {
                    _logger.LogWarning("Booking balance should be zero");
                    return ErrorResponse("Booking balance should be zero");
                }

                var cardPayments = _bookingPaymentsService.PaymentsAvailableForRefund(booking);
                if (!cardPayments.Any())
                {
                    _logger.LogWarning("Skipped - Booking originally paid for with credit");
                    return ErrorResponse("Skipped - Booking originally paid for with credit");
                }

                if (cardPayments.Sum(x => x.Amount) <= 0)
                {
                    // If card payments sum is zero that means all is refunded
                    _logger.LogWarning("Skipped - no card payments to refund");
                    return ErrorResponse("Skipped - no card payments to refund");
                }

                // Step 1. Redeem vouchers back to booking
                // We need to redeem the same amount fo money as cash payments to keep balanse eq 0
                var creditAmountToRedeem = cardPayments.Sum(x => x.Amount);

                List<CreditSpend> spendResults = null;
                Customer customer = null;
                try
                {
                    customer = await _actions.GetCustomerByEmailOrCreate(booking.CustomerDetails.Email);
                    spendResults = await _voucherPaymentService.Redeem(creditAmountToRedeem, "GBP", booking.BookingReference, booking?.Package?.Accom?.Code, booking?.MarketCode, customer.SourceId ?? customer.Id);

                    await _voucherPaymentService.AddPaymentInfo(spendResults, booking.LeadPassenger, booking.BookingReference, booking.MarketCode, booking.Language, null, null);
                }
                catch (Exception ex)
                {
                    if (ex is VoucherRedeemExeption)
                    {
                        _logger.LogError(ex, "Cannot be processed, not enough credit in customer account");
                        return new BulkToolResponse() { Message = "Cannot be processed, not enough credit in customer account", Reference = reference, CorrelationId = correlationId, Note = string.Empty };
                    }

                    _logger.LogError(ex, "Cannot update payment information. rollback voucher redemptions");

                    await _voucherPaymentService.Rollback(spendResults, customer?.SourceId ?? customer?.Id);

                    return new BulkToolResponse() { Message = "Cannot redeem credit", Reference = reference, CorrelationId = correlationId, Note = string.Empty };
                }

                // Step 2. Refund only card payments
                // first of all we get booking again to get updated payment items
                booking = await _actions.TryGetBooking(booking.BookingReference);
                var refundResult = await _actions.RefundBoooking(booking, _bulkToolSettings.Messages.SuccessfullyUndoCredit, _bulkToolSettings.Messages.FailedUndoRefundCredit, correlationId, string.Empty, false);

                var voucherIds = string.Join(";", (spendResults ?? new List<CreditSpend>()).Select(x => x.VouchersIds));
                return new BulkToolResponse() { Message = refundResult.Message, Reference = reference, CorrelationId = string.Empty, Note = voucherIds };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to credit");
                return new BulkToolResponse() { Message = "Credit failed", Reference = reference, CorrelationId = correlationId, Note = string.Empty };
            }
        }
    }
}
