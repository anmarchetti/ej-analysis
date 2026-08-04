using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    /// <summary>
    /// Bookings payment services
    /// </summary>
    public class BookingRefundService : IBookingRefundService
    {
        private readonly IBookingPaymentsRepository _bookingPaymentsRepository;
        private readonly IPaymentsService _paymentsService;
        private readonly IBookingRepository _bookingRepository;
        private readonly BookingsMemosSettings _memosSettings;
        private readonly ILogger<BookingRefundService> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="bookingPaymentsRepository"></param>
        /// <param name="paymentsService"></param>
        /// <param name="bookingRepository"></param>
        /// <param name="apiSettings"></param>
        /// <param name="logger"></param>
        public BookingRefundService(
            IBookingPaymentsRepository bookingPaymentsRepository,
            IPaymentsService paymentsService,
            IBookingRepository bookingRepository,
            IOptions<ApiSettings> apiSettings,
            ILogger<BookingRefundService> logger)
        {
            ArgumentNullException.ThrowIfNull(apiSettings);
            _logger = logger;
            _bookingPaymentsRepository = bookingPaymentsRepository;
            _paymentsService = paymentsService;
            _bookingRepository = bookingRepository;
            _memosSettings = apiSettings.Value.BookingsMemos;
        }

        /// <inheritdoc />
        public List<PaymentHistoryItem> PaymentsAvailableForRefund(BookingResponse booking)
        {
            var payments = booking.PaymentInfo.PaymentHistory;

            return payments
                .Where(x => !string.IsNullOrEmpty(x.AuthCode)) // item should have AuthCode
                .ToList();
        }

        /// <inheritdoc />
        public async Task<List<BookingRefundResponse>> RefundNonCreditPayments(BookingResponse booking)
        {
            var results = new List<BookingRefundResponse>();

            var paymentsForRefund = PaymentsAvailableForRefund(booking);

            foreach (var payment in paymentsForRefund)
            {
                var bookingRefundResponse = new BookingRefundResponse();
                try
                {
                    if (payment.Amount > 0)
                    {
                        // Refund payment from cancelled booking
                        if (!string.IsNullOrEmpty(payment.RefundAgainstId))
                        {
                            continue;
                        }

                        if (payment.RefundableAmount is not null)
                        {
                            if (payment.RefundableAmount == 0)
                            {
                                _logger.LogInformation("Payment {PayId} is already refunded, skip it", payment.PayId);
                                continue;
                            }

                            payment.Amount = payment.RefundableAmount.Value;
                        }

                        if (string.IsNullOrEmpty(payment.AuthCode))
                        {
                            _logger.LogWarning("Payment {PayId} doesn't have valid AuthCode and can't be refunded", payment.PayId);
                            continue;
                        }

                        // AuthCode in Atcom keeps Payment ID from EI
                        var refundResult = await _paymentsService.RefundPayment(booking.BookingReference, payment.AuthCode, (decimal)payment.Amount, payment.CurIso, booking.LeadPassenger.Email);
                        var refundResultAuthCode = refundResult.PaymentId;

                        // Refund payment from cancelled booking
                        var bookingResponse = await _bookingPaymentsRepository.AddCreditPaymentInfo(booking.BookingReference, booking.MarketCode, booking.Language, payment, payment.PayId, refundResultAuthCode, booking.LeadPassenger, null, null);

                        if (bookingResponse.PaymentInfo.PaymentHistory == null)
                        {
                            throw new ApiException(ApiExceptionCodes.RefundError, new ApiError[] { }, $"Cannot refund payment {payment.PayId}");
                        }

                        bookingRefundResponse.Payment = payment;
                        _logger.LogInformation("Refund authCode: {AuthCode}, Refund Result:{Result}, Refund Status:{Status}, Original Payment: {PayId}, amount: {Amount}, reference: {BookingReference}",
                            refundResultAuthCode, refundResult.Result, refundResult.Status, payment.PayId, payment.Amount, booking.BookingReference);
                    }
                    else
                    {
                        _logger.LogInformation("Skipping payment ID: {PayId}, amount: {Amount}, reference: {BookingReference}", payment.PayId, payment.Amount, booking.BookingReference);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Cannot refund {PayId}, amount: {Amount}, booking: {BookingReference}", payment.PayId, payment.Amount, booking.BookingReference);
                    bookingRefundResponse.Exception = new ApiException(ApiExceptionCodes.RefundError, new ApiError[] { }, $"Cannot refund {payment.PayId} amount: {payment.Amount}");
                }
                results.Add(bookingRefundResponse);
            }

            return results;
        }

        /// <inheritdoc />
        public async Task<List<BookingRefundResponse>> Refund(BookingResponse booking, decimal amountToRefund)
        {
            var results = new List<BookingRefundResponse>();
            
            var originalAmountToRefund = amountToRefund;

            var paymentsForRefund = PaymentsAvailableForRefund(booking);
            paymentsForRefund.Reverse();// reverse to refund latest payments first            

            // Validate if we can refund amount at all
            var totalAvailableForRefund = paymentsForRefund
                .Where(x => x.Amount > 0)
                .Sum(x => x.RefundableAmount is not null ? x.RefundableAmount.Value : x.Amount);

            if (totalAvailableForRefund < amountToRefund)
            {
                throw new ArgumentOutOfRangeException(nameof(amountToRefund), "Amount to refund is bigger than available card payments");
            }

            try
            {
                foreach (var payment in paymentsForRefund)
                {
                    if (amountToRefund <= 0)
                    {
                        break;
                    }

                    var bookingRefundResponse = new BookingRefundResponse();
                    if (payment.Amount <= 0)
                    {
                        _logger.LogInformation("Skipping payment ID: {PayId}, amount: {Amount}, reference: {BookingReference}", payment.PayId, payment.Amount, booking.BookingReference);
                        continue;
                    }
                    // Refund payment from cancelled booking
                    if (!string.IsNullOrEmpty(payment.RefundAgainstId))
                    {
                        continue;
                    }

                    if (payment.RefundableAmount is not null)
                    {
                        if (payment.RefundableAmount == 0)
                        {
                            _logger.LogInformation("Payment {PayId} is already refunded, skip it", payment.PayId);
                            continue;
                        }

                        payment.Amount = payment.RefundableAmount.Value;
                    }

                    if (string.IsNullOrEmpty(payment.AuthCode))
                    {
                        _logger.LogWarning("Payment {PayId} doesn't have valid AuthCode and can't be refunded", payment.PayId);
                        continue;
                    }

                    // if transaction amount greater than we have to refund
                    if (payment.Amount > amountToRefund)
                    {
                        payment.Amount = amountToRefund;
                    }

                    amountToRefund -= payment.Amount; // reduce amount to refund (not to forget about it)

                    // AuthCode in Atcom keeps Payment ID from EI
                    var refundResult = await _paymentsService.RefundPayment(booking.BookingReference, payment.AuthCode, (decimal)payment.Amount, payment.CurIso, booking.LeadPassenger.Email);
                    var refundResultAuthCode = refundResult.PaymentId;

                    bookingRefundResponse.Payment = payment;
                    bookingRefundResponse.PaymentId = refundResultAuthCode;
                    results.Add(bookingRefundResponse);

                    _logger.LogInformation("Refund authCode: {RefundResultAuthCode}, Refund Result:{Result}, Refund Status:{Status}, Original Payment: {PayId}, amount: {Amount}, reference: {BookingReference}",
                        refundResultAuthCode, refundResult.Result, refundResult.Status, payment.PayId, payment.Amount, booking.BookingReference);

                    // Refund payment from cancelled booking
                    var bookingResponse = await _bookingPaymentsRepository.AddCreditPaymentInfo(booking.BookingReference, booking.MarketCode, booking.Language, payment, payment.PayId, refundResultAuthCode, booking.LeadPassenger, null, null);

                    if (bookingResponse.PaymentInfo.PaymentHistory == null)
                    {
                        throw new ApiException(ApiExceptionCodes.RefundError, new ApiError[] { }, $"Cannot refund payment {payment.PayId}");
                    }
                }
            }
            catch (Exception ex)
            {
                await RollbackRefund(booking, new ReadOnlyCollection<BookingRefundResponse>(results), ex);
                throw;
            }
            await AddCashMemoToBooking(originalAmountToRefund, booking);
            return results;
        }
        
        /// <inheritdoc />
        public async Task AddCashMemoToBooking(decimal cashRefundAmount, BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(booking);
            await _bookingRepository.ModifyMemo(booking.BookingReference, new BookingMemo
            {
                Code = _memosSettings.Cash.Code,
                Description =
                    $"{_memosSettings.Cash.Description} {cashRefundAmount} {booking.Currency.Code}"
            });
        }
        
        private static readonly Regex MemoDescriptionRefundAmountRegex = new(@".*?(\d+(?:\.\d+)?)\s+[A-Z]{3}$", RegexOptions.Compiled, TimeSpan.FromSeconds(1));
        
        /// <inheritdoc />
        public decimal? GetRefundAmountFromCashRefundMemo(BookingResponse bookingResponse)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);

            var memoDescription = bookingResponse.Memo?.LastOrDefault(i => i.Code == _memosSettings.Cash.Code);
            if (memoDescription == null)
                return GetRefundAmountFromCashRefundMemoForOldBooking(bookingResponse);

            if (string.IsNullOrEmpty(memoDescription.Text))
                return null;

            Match match = MemoDescriptionRefundAmountRegex.Match(memoDescription.Text);
            if (match.Success)
            {
                string refundAmount = match.Groups[1].Value;
                return Convert.ToDecimal(refundAmount, CultureInfo.InvariantCulture);
            }

            return null;
        }
        
        private static decimal GetRefundAmountFromCashRefundMemoForOldBooking(BookingResponse bookingResponse)
        {
            var cancellationDate = bookingResponse.CancellationDate;
            var allRefundedCashPayments = bookingResponse.PaymentInfo.PaymentHistory.Where(i => !string.IsNullOrEmpty(i.RefundAgainstId) && PaymentWasDoneInsideThreshold(i.PaymentDate, cancellationDate)).ToList();

            var refundedCash = allRefundedCashPayments.Where(i => !i.IsCredit).Sum(i => i.Amount) * -1;

            return refundedCash;
        }
        
        private static bool PaymentWasDoneInsideThreshold(DateTimeOffset? paymentDate, DateTime? cancellationDate)
        {
            if (!paymentDate.HasValue || !cancellationDate.HasValue)
            {
                return false;
            }
            var threshold = TimeSpan.FromMinutes(1);
            var cancellationDateOffset = new DateTimeOffset(cancellationDate.Value);

            if (paymentDate.Value > cancellationDateOffset)
                return true;

            var timeDifference = cancellationDateOffset - paymentDate.Value;
            return timeDifference <= threshold;
        }

        /// <inheritdoc />
        public async Task<bool> RollbackRefund(BookingResponse bookingResponse, ReadOnlyCollection<BookingRefundResponse> refunds, Exception exception = null)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);

            var result = true;
            const string initialLogMessage = "Got error for booking: {BookingReference}. Need to rollback refund";
            if (exception != null)
            {
                _logger.LogInformation(exception, initialLogMessage, bookingResponse.BookingReference);
            }
            else
            {
                _logger.LogInformation(initialLogMessage, bookingResponse.BookingReference);
            }

            if (refunds?.Count > 0)
            {
                var leadPaxEmail = bookingResponse.LeadPassenger?.Email;
                var reference = bookingResponse.BookingReference;
                foreach (var refund in refunds)
                {
                    try
                    {
                        const string cancellingPaymentLogMessage = "Cancelling payment {PaymentId}";
                        if (exception != null)
                        {
                            _logger.LogInformation(exception, cancellingPaymentLogMessage, refund.PaymentId);
                        }
                        else
                        {
                            _logger.LogInformation(cancellingPaymentLogMessage, refund.PaymentId);
                        }

                        var cancelPaymentResponse = await _paymentsService.CancelPayment(reference, refund.PaymentId, leadPaxEmail);
                        _logger.LogInformation("payment ({PaymentId}) cancelled successfully", refund.PaymentId);
                        _logger.LogInformation("new payment ({PaymentId}) was created successfully", cancelPaymentResponse.PaymentId);
                    }
                    catch (Exception e)
                    {
                        _logger.LogError(e, "Failed to rollback refund payment {PaymentId}", refund.PaymentId);
                        result = false;
                    }
                }
            }

            return result;
        }
    }
}