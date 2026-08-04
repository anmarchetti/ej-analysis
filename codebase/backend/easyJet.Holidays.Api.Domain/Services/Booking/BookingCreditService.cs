using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using System.Globalization;
using BookingRefundResponse = easyJet.Holidays.Api.Domain.Data.Vouchers.BookingRefundResponse;
using CustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    public class BookingCreditService : IBookingCreditService
    {
        private readonly ILogger<BookingCreditService> _logger;
        private readonly ApiSettings _apiSettings;
        private readonly IVouchersService _vouchersService;
        private readonly IBookingRepository _bookingRepository;
        private readonly VoucherSettings _voucherSettings;
        private readonly IBookingRefundService _bookingRefundService;
        private readonly IVoucherPaymentFlowService _voucherPaymentService;
        private readonly IBookingRefundEligibleService _bookingRefundEligibleService;

        public BookingCreditService(
            IOptions<ApiSettings> apiSettings,
            ILogger<BookingCreditService> logger,
            IVouchersService vouchersService,
            IBookingRepository bookingRepository,
            IBookingRefundService bookingRefundService,
            IVoucherPaymentFlowService voucherPaymentService,
            IBookingRefundEligibleService bookingRefundEligibleService
            )
        {
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _voucherSettings = apiSettings?.Value?.Vouchers ?? throw new ArgumentNullException(nameof(apiSettings));
            _logger = logger;
            _vouchersService = vouchersService;
            _bookingRepository = bookingRepository;
            _bookingRefundService = bookingRefundService;
            _voucherPaymentService = voucherPaymentService;
            _bookingRefundEligibleService = bookingRefundEligibleService;
        }

        /// <inheritdoc />
        public async Task<BookingRefundResponse> RefundBooking(ConvertBookingToCreditRequest bookingRequest,
            string customerId = null, CustomerDetails customerDetails = null)
        {
            /*
             1. Create voucher for the full amount the user has paid on the booking 
                And the payment reference will be the ID of the voucher being created
                Note: Multiple payments on a booking result in a single payment.             
             2. Mark booking as cancelled
             3. Add a memo is added to the booking “Voucher created”
             4. Add negative payment to reverse all money paid on the booking onto a payment type of “credit-issued”
             */

            var booking = await _bookingRepository.GetBooking(bookingRequest);
            var canBeConverted = await _bookingRefundEligibleService.IsEligibleForFullRefund(booking, customerDetails);

            _logger.LogInformation("Refund action: {Type}", bookingRequest.Type);
            var action = bookingRequest.Type == ConvertType.REFUND ? canBeConverted.Refund : canBeConverted.Credit;
            if (!action.IsEligible)
            {
                _logger.LogInformation("Refund type is {Type} and it's disabled", bookingRequest.Type);
                throw new ApiException(ApiExceptionCodes.BookingCreditForbidden);
            }

            var memos = new List<BookingMemo>();

            var result = new BookingRefundResponse();
            List<Data.Booking.BookingRefundResponse> refunds = null;
            if (action.Cash > 0)
            {
                _logger.LogInformation("Doing refund part, amount: {Cash}", action.Cash);
                refunds = await _bookingRefundService.Refund(booking, action.Cash);
                refunds.ForEach(refund =>
                {
                    _logger.LogInformation("Refunded paymentId: {PayId}, amount: {Amount}. Error: {Message}", refund.Payment?.PayId, refund.Payment?.Amount, refund.Exception?.Message);
                });

                result.Cash = action.Cash;
            }

            _logger.LogInformation("Doing credit part, amount: {Credit}", action.Credit);
            // TODO refactor to split vouchers and booking cancellation (can't do it now, on holiday)
            var convertResult = await _vouchersService.ConvertBooking(booking, bookingRequest.Source, action.CreditBreakdown, customerId, customerDetails);
            result.Credit = convertResult.Credit;
            result.Credits = convertResult.Credits;

            await AddMemos(booking, canBeConverted, action, memos);

            return result;
        }

        /// <inheritdoc />
        public async Task<List<CreditSpend>> SpendCredit(BookingResponse booking, decimal amount, string currency, string customerId, RedemptionMetadata redemptionMetadata = null)
        {
            string bookingReference = booking.BookingReference;
            var spendVoucherResults = new List<CreditSpend>();
            var dueAmount = booking.PaymentInfo.BalanceDueAmount;

            if (dueAmount <= 0)
            {
                _logger.LogError("Booking is fully paid");
                throw new ApiException(ApiExceptionCodes.CreditsSpendCreditsFullyPaid);
            }
            if (amount <= 0)
            {
                _logger.LogError("Credit amount should be greater than 0");
                throw new ApiException(ApiExceptionCodes.CreditsSpendCreditsPriceNegative);
            }
            if (amount > dueAmount)
            {
                _logger.LogError("Credit amount should not be greater than {DueAmount}", dueAmount);
                throw new ApiException(ApiExceptionCodes.CreditsSpendCreditsInvalidPrice);
            }
            if (_apiSettings.Vouchers?.IsActive != true)
            {
                _logger.LogError("Credit service is not available");
                throw new ApiException(ApiExceptionCodes.CreditsSpendCreditsCreditsDisabled);
            }

            try
            {
                spendVoucherResults = await _voucherPaymentService.Redeem(amount, currency, bookingReference, booking?.Package?.Accom?.Code, booking?.MarketCode, customerId, redemptionMetadata);
                // Add credit payment
                await _voucherPaymentService.AddPaymentInfo(spendVoucherResults, booking.LeadPassenger, bookingReference, booking.MarketCode, booking.Language, null, null);
                return spendVoucherResults;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to redeem credits");
                var emptyErrors = Array.Empty<ApiError>();
                IEnumerable<ApiError> apiErrors = new List<ApiError>();

                if (ex is ApiException)
                {
                    apiErrors = (ex as ApiException)?.InnerErrors ?? emptyErrors;
                }

                if (ex is VoucherRedeemExeption)
                {
                    if (((VoucherRedeemExeption)ex).Code.Code == ApiExceptionCodes.CreditsInsufficientFunds.Code)
                    {
                        // We don't need to do rollback here. All vouchers are rolled back in Redeem method
                        throw new ApiException(ApiExceptionCodes.CreditsInsufficientFunds, apiErrors.ToArray(), ex);
                    }
                }

                var redemptionException = await _voucherPaymentService.Rollback(spendVoucherResults, customerId);
                apiErrors = apiErrors.Union(redemptionException?.InnerErrors ?? emptyErrors);

                // then throw api exception
                throw new ApiException(ApiExceptionCodes.CreditsSpendCredits, apiErrors.ToArray(), ex);
            }
        }

        /// <inheritdoc />
        public async Task<BookingRefundResponse> PartialRefund(BookingResponse bookingResponse, ConvertType convertType, decimal refundAmount)
        {

            var canBeConverted = await _bookingRefundEligibleService.IsEligibleForPartialRefund(bookingResponse, refundAmount, null);

            _logger.LogInformation($"Refund action: {convertType}");

            var action = convertType == ConvertType.REFUND ? canBeConverted.Refund : canBeConverted.Credit;

            if (!action.IsEligible)
            {
                _logger.LogInformation($"Refund type is {convertType}. Refund amount: {refundAmount} and it's not eligible for this booking");
                throw new ApiException(ApiExceptionCodes.BookingRefundEligible);
            }

            var bookingRefundResponse = await ProcessRefund(bookingResponse, action, _voucherSettings.Source.Web);

            return bookingRefundResponse;
        }

        private async Task<BookingRefundResponse> ProcessRefund(BookingResponse bookingResponse, EligibleAction action,
    string source, string customerId = null, CustomerDetails customerDetails = null)
        {
            var result = new BookingRefundResponse();

            if (action.Cash > 0)
            {
                _logger.LogInformation("Doing refund part, amount: {Cash}", action.Cash);
                var refunds = await _bookingRefundService.Refund(bookingResponse, action.Cash);

                refunds.ForEach(refund =>
                {
                    _logger.LogInformation("Refunded paymentId: {PayId}, amount: {Amount}. Error: {Message}",
                        refund.Payment?.PayId, refund.Payment?.Amount, refund.Exception?.Message);
                });

                result.Cash = action.Cash;
            }

            _logger.LogInformation("Doing credit part, amount: {Credit}", action.Credit);

            // TODO refactor to split vouchers and booking cancellation (can't do it now, on holiday)
            var convertResult = await _vouchersService.ConvertBooking(bookingResponse, source, action.CreditBreakdown,
                customerId, customerDetails, false);

            result.Credit = convertResult.Credit;
            result.Credits = convertResult.Credits;

            return result;
        }

        /// <summary>
        /// Add memos based on selected action and rules
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="canBeConverted"></param>
        /// <param name="action"></param>
        /// <param name="memos"></param>
        /// <returns></returns>
        private async Task AddMemos(BookingResponse booking, EligibleForRefund canBeConverted, EligibleAction action, List<BookingMemo> memos)
        {
            var memoDescription = string.Create(CultureInfo.InvariantCulture, $"Refund £{action.Cash} cash, £{action.Credit} credit");
            if (canBeConverted.Rules == RefundRules.CreditOnly)
            {
                // REP7 - 25% credit
                memos.Add(new BookingMemo
                {
                    Code = _voucherSettings.BookingMemos.CreditRefund25Percents.Code,
                    Description = memoDescription
                });
            }
            else if (canBeConverted.Rules == RefundRules.QuarterOfCashOrHalfOfCredit)
            {
                if (action.Cash <= 0)
                {
                    // REP8 50% credit only
                    memos.Add(new BookingMemo
                    {
                        Code = _voucherSettings.BookingMemos.CreditRefund50Percents.Code,
                        Description = memoDescription
                    });
                }
                else if (action.Credit <= 0)
                {
                    // REP5 25% cash only
                    memos.Add(new BookingMemo
                    {
                        Code = _voucherSettings.BookingMemos.CacheRefund25Percents.Code,
                        Description = memoDescription
                    });
                }
                else
                {
                    // REP6 25% cash + credit
                    memos.Add(new BookingMemo
                    {
                        Code = _voucherSettings.BookingMemos.CacheAndCreditRefund25Percents.Code,
                        Description = memoDescription
                    });
                }
            }
            else
            {
                // Normal flow
                if (action.Cash > 0)
                {
                    // cache & credit
                    memos.Add(new BookingMemo
                    {
                        Code = _voucherSettings.BookingMemos.MovedToCreditAndCash.Code,
                        Description = memoDescription
                    });
                }
                else
                {
                    // credit only
                    memos.Add(new BookingMemo
                    {
                        Code = _voucherSettings.BookingMemos.MovedToCredit.Code,
                        Description = memoDescription
                    });
                }
            }

            foreach (var memo in memos)
            {
                await _bookingRepository.ModifyMemo(booking.BookingReference, memo);
            }
        }
    }
}