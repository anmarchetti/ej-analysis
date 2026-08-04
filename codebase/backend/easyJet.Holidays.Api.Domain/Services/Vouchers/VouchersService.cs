using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Settings;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Force.DeepCloner;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using System.Net;
using System.Runtime.CompilerServices;
using OrderItem = easyJet.Holidays.Api.Domain.Data.Vouchers.OrderItem;
using Redemption = easyJet.Holidays.Api.Domain.Data.Vouchers.Redemption;
using Voucher = easyJet.Holidays.Api.Domain.Data.Vouchers.Voucher;
using VoucherType = Voucherify.DataModel.VoucherType;
using VVoucherify = Voucherify;
using easyJet.Holidays.Api.Domain.Data.Vouchers.Helpers;
using easyJet.Holidays.Api.Domain.Interfaces.SingleUseVoucher;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Text.RegularExpressions;

[assembly: InternalsVisibleTo("easyJet.Holidays.Api.Domain.Tests")]
namespace easyJet.Holidays.Api.Domain.Services.Vouchers
{
    /// <inheritdoc cref="IVouchersService"/>
    public class VouchersService : IVouchersService
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly IBookingRepository _bookingRepository;
        private readonly IBookingPaymentsRepository _bookingPaymentsRepository;
        private readonly IVouchersCustomerRepository _customersRepository;
        private readonly IVouchersRepository _vouchersRepository;
        private readonly VoucherSettings _voucherSettings;
        private readonly ILogger<VouchersService> _logger;
        private readonly IHotelsService _hotelsService;
        private readonly VoucherifySettings _voucherifySettings;
        private readonly IAwsUserCreditsService _awsUserCreditsService;
        private readonly ISingleUseVoucherService _singleUseVoucherService;
        private readonly IApiSettingsService _apiSettingsService;

        private readonly HashSet<string> _validReasonCodes;
        private readonly HashSet<string> _validPromoCodes;

        /// <summary>
        /// Implementation of <see cref="IVouchersService"/>
        /// </summary>
        /// <param name="customersRepository"></param>
        /// <param name="authenticationService"></param>
        /// <param name="vouchersRepository"></param>
        /// <param name="bookingRepository"></param>
        /// <param name="bookingPaymentsRepository"></param>
        /// <param name="logger"></param>
        /// <param name="apiSettings"></param>
        /// <param name="voucherifySettings"></param>
        /// <param name="awsUserCreditsService"></param>
        /// <param name="hotelsService"></param>
        /// <param name="singleUseVoucherService"></param>
        /// <param name="apiSettingsService"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public VouchersService(
            IVouchersCustomerRepository customersRepository, IAuthenticationService authenticationService,
            IVouchersRepository vouchersRepository,
            IBookingRepository bookingRepository,
            IBookingPaymentsRepository bookingPaymentsRepository,
            ILogger<VouchersService> logger,
            IOptions<ApiSettings> apiSettings,
            IOptions<VoucherifySettings> voucherifySettings,
            IAwsUserCreditsService awsUserCreditsService,
            IHotelsService hotelsService,
            ISingleUseVoucherService singleUseVoucherService,
            IApiSettingsService apiSettingsService)
        {
            _ = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _voucherSettings = apiSettings.Value.Vouchers ?? throw new ArgumentNullException(nameof(apiSettings));

            _voucherifySettings =
                voucherifySettings?.Value ?? throw new ArgumentNullException(nameof(voucherifySettings));
            _authenticationService = authenticationService;
            _customersRepository = customersRepository;
            _vouchersRepository = vouchersRepository;
            _bookingRepository = bookingRepository;
            _bookingPaymentsRepository = bookingPaymentsRepository;
            _hotelsService = hotelsService;
            _awsUserCreditsService = awsUserCreditsService;
            _apiSettingsService = apiSettingsService;
            _singleUseVoucherService = singleUseVoucherService;
            _logger = logger;

            var types = _voucherSettings.Types;
            _validReasonCodes = new(
                [types.Refund, types.Goodwill, types.Incentive, types.GiftCard, types.OneTimeUse],
                StringComparer.OrdinalIgnoreCase
            );

            _validPromoCodes = new(
                _voucherSettings.PromoVouchers?.Types ?? [],
                StringComparer.OrdinalIgnoreCase
            );
        }

        /// <inheritdoc />>
        public bool IsReasonCodeValid(string reasonCode)
        {
            return _validReasonCodes.Contains(reasonCode) || _validPromoCodes.Contains(reasonCode);
        }

        ///  <inheritdoc />
        public async Task<string> ExchangeDiscountToAtcomCode(string voucherCode)
        {
            try
            {
                var validation = await _vouchersRepository.ValidateRedemption(voucherCode, null, null);

                if (!validation.Valid)
                {
                    var code = ApiExceptionCodes.VoucherInvalid;

                    // "reason": "voucher not found"
                    if (validation.Reason == _voucherifySettings.ReasonNotFound)
                    {
                        code = ApiExceptionCodes.VoucherNotFound;
                    }

                    // "reason": "quantity exceeded"
                    if (validation.Reason == _voucherifySettings.ReasonExceeded)
                    {
                        code = ApiExceptionCodes.VoucherExceeded;
                    }

                    throw new ApiException(code, new[]
                    {
                        new ApiError
                        {
                            Code = code.Code, Message = ApiExceptionCodes.VoucherInvalid.Description
                        }
                    }, "Error occurred while validating voucher");
                }

                return validation.Metadata[_voucherSettings.Discounts.MetadataKey]?.ToString();
            }
            catch (Exception ex)
            {
                if (ex is ApiException)
                {
                    var code = ((ApiException)ex).Code.Code;
                    if (code == ApiExceptionCodes.VoucherInvalid.Code ||
                        code == ApiExceptionCodes.VoucherNotFound.Code ||
                        code == ApiExceptionCodes.VoucherExceeded.Code)
                    {
                        throw;
                    }
                }

                // do not disclose underlying errors
                throw new ApiException(ApiExceptionCodes.VoucherInvalid);
            }
        }

        /// <inheritdoc />
        public async Task<string> MapDiscountToAtcomCode(string voucherCode)
        {
            try
            {
                var voucher = await _vouchersRepository.Get(voucherCode);

                return voucher.Metadata[_voucherSettings.Discounts.MetadataKey]?.ToString() ?? string.Empty;
            }
            catch
            {
                throw new ApiException(ApiExceptionCodes.VoucherInvalid);
            }
        }

        ///  <inheritdoc />
        public async Task<string> UseDiscountVoucher(string voucherCode, string bookingReference, decimal? amount = null)
        {
            var bookingRefMeta = new Dictionary<string, object>
            {
                {VoucherifyMetaKeys.BookingRef, bookingReference}
            };
            var redemption = await _vouchersRepository.ProcessRedemption(voucherCode, amount, null, bookingRefMeta);

            if (redemption.Result != VVoucherify.DataModel.RedemptionResult.Success)
            {
                throw new ApiException(ApiExceptionCodes.FailedRedeemVoucher, $"Failed to redeem voucher: {voucherCode}", null, null);
            }

            // And update booking-ref for voucher.             
            await _vouchersRepository.UpdateDetails(voucherCode, bookingRefMeta, null);

            return redemption.Id;
        }

        /// <inheritdoc />
        public async Task<Data.Vouchers.BookingRefundResponse> ConvertBooking(BookingResponse booking, string source,
            CreditBreakdown creditBreakdown, string customerId = null,
            Data.Authentication.CustomerDetails customerDetails = null, bool isFullRefund = true)
        {
            if (creditBreakdown == null)
            {
                _logger.LogError("Credit breakdown cannot be null");
                throw new ArgumentNullException(nameof(creditBreakdown));
            }

            var currency = new Currency { Code = booking.PaymentInfo.Currency };

            /*
             1. Create voucher for the full amount the user has paid on the booking 
                And the payment reference will be the ID of the voucher being created
                Note: Multiple payments on a booking result in a single payment.             
             2. Mark booking as cancelled if booking note cancelled
                Add a memo is added to the booking “Voucher created”
                Add negative payment to reverse all money paid on the booking onto a payment type of “credit-issued”
             */

            // 0. Validate initial data: customer and booking
            customerDetails = customerDetails ?? await _authenticationService.CustomerDetails();
            customerId = customerId ?? await _authenticationService.MappedCustomerId(customerDetails);
            if (string.IsNullOrEmpty(customerId))
            {
                throw new ApiException(ApiExceptionCodes.CustomerNoMappedId);
            }

            // 1. Create customer if needed
            await _customersRepository.GetOrCreate(customerId, customerDetails);

            var redemptionMetadata = new RedemptionMetadata()
            {
                Source = source,
                Action = isFullRefund
                    ? _voucherSettings?.Action?.CreditAndRefund
                    : _voucherSettings?.Action?.PartialRefund
            };

            var meta = await BuildMetadata(booking.BookingReference, booking.Package?.Accom?.Code, currency, redemptionMetadata);
            meta.Add(VoucherifyMetaKeys.Market, booking.MarketCode);

            var voucherId = booking.PaymentInfo.PaymentHistory?.Length > 0
                ? $"{booking.PaymentInfo.PaymentHistory[booking.PaymentInfo.PaymentHistory.Length - 1].PayId}"
                : $"{booking.BookingReference}";

            // 2. Mark booking as cancelled if booking note cancelled
            // Add a memo is added to the booking “Voucher created”
            // Add negative payment to reverse all money paid on the booking onto a payment type of “credit-issued”
            await AddCreditToBooking(customerId, creditBreakdown, voucherId, booking, meta, isFullRefund);

            // Force update user cache and return customer credits
            var userCredits = await MyCredits(customerId, true);
            var currencyCredits = userCredits.GetValueOrDefault(currency);

            return new Data.Vouchers.BookingRefundResponse { Credit = currencyCredits, Credits = creditBreakdown.Total() };
        }


        /// <inheritdoc />
        public async Task<BookingRefundExtendedResponse> RefundCreditsAndUpdateBooking(BookingResponse booking,
            BookingCancellationCreditRefundBreakdown bookingCancellationCreditRefundBreakdown,
            string source,
            string customerId,
            bool isFullRefund = true)
        {
            ArgumentNullException.ThrowIfNull(booking);
            ArgumentNullException.ThrowIfNull(bookingCancellationCreditRefundBreakdown);
            ArgumentException.ThrowIfNullOrEmpty(source);
            ArgumentException.ThrowIfNullOrEmpty(customerId);

            var currency = new Currency { Code = booking.PaymentInfo.Currency };

            /*
             1. Create voucher for the full amount the user has paid on the booking 
                And the payment reference will be the ID of the voucher being created
                Note: Multiple payments on a booking result in a single payment.             
             2. Mark booking as cancelled if booking note cancelled
                Add a memo is added to the booking “Voucher created”
                Add negative payment to reverse all money paid on the booking onto a payment type of “credit-issued”
             */

            var redemptionMetadata = new RedemptionMetadata()
            {
                Source = source,
                Action = isFullRefund
                    ? _voucherSettings?.Action?.CreditAndRefund
                    : _voucherSettings?.Action?.PartialRefund
            };

            var meta = await BuildMetadata(booking.BookingReference, booking.Package?.Accom?.Code, currency, redemptionMetadata);
            meta.Add(VoucherifyMetaKeys.Market, booking.MarketCode);

            var voucherId = booking.PaymentInfo.PaymentHistory?.Length > 0
                ? $"{booking.PaymentInfo.PaymentHistory[^1].PayId}"
                : $"{booking.BookingReference}";

            // 2. Mark booking as cancelled if booking note cancelled
            // Add a memo is added to the booking “Voucher created”
            // Add negative payment to reverse all money paid on the booking onto a payment type of “credit-issued”
            var createdVouchers = await CreateVouchersAndUpdateBooking(customerId, bookingCancellationCreditRefundBreakdown, voucherId, booking, meta);

            // Force update user cache and return customer credits
            var userCredits = await MyCredits(customerId, true);
            var currencyCredits = userCredits.GetValueOrDefault(currency);

            return new BookingRefundExtendedResponse()
            {
                Credit = currencyCredits,
                Credits = bookingCancellationCreditRefundBreakdown.Total(),
                CreatedVouchers = new ReadOnlyCollection<CreatedVoucher>(createdVouchers)
            };
        }

        /// <inheritdoc/>
        public async Task<List<CreatedVoucher>> AddCreditToBooking(string customerId, CreditBreakdown creditBreakdown,
            string voucherId, BookingResponse booking, Dictionary<string, object> meta, bool markBookingAsCancelled = true)
        {
            ArgumentNullException.ThrowIfNull(booking);

            var allNewVouchers = new List<CreatedVoucher>(); // collection of all new vouchers

            var currency = booking.PaymentInfo.Currency;
            try
            {
                string goodwillCode = null;
                string refundCode = null;
                string giftCardCode = null;

                var promoItemId = booking.PaymentInfo.PaymentHistory.Length;

                var promoPayItems = booking
                    .PaymentInfo
                    .PaymentHistory
                    ?.Where(paymentItem => paymentItem.IsPromoCredit)
                    .GroupBy(paymentItem =>
                    {
                        var settings = _apiSettingsService.GetPaymentCodesSettingsByPaymentCode(paymentItem.PayMethodCode);
                        return new { settings.Reason };
                    })
                    .Select(paymentReasonGroup =>
                    {
                        var settings = _apiSettingsService.GetPaymentCodesSettingsByReason(paymentReasonGroup.Key.Reason);
                        return new
                        {
                            paymentReasonGroup.Key.Reason,
                            Amount = paymentReasonGroup.Sum(x => x.Amount),
                            PromoId = $"{voucherId}-{promoItemId++}-promo",
                            settings.PriorityNumber,
                            settings.ExpirationDate
                        };
                    })
                    .Where(promoReasonGroup => promoReasonGroup.Amount > 0)
                    .OrderBy(paymentItem => paymentItem.PriorityNumber)
                    .ToArray();

                if (creditBreakdown.Goodwill > 0)
                {
                    goodwillCode = await GetAndCreateCode(
                        _voucherSettings.Types.Goodwill,
                        customerId,
                        creditBreakdown.Goodwill,
                        currency,
                        voucherId,
                        meta,
                        allNewVouchers
                    );
                }

                if (creditBreakdown.GiftCard > 0)
                {
                    giftCardCode = await GetAndCreateCode(
                        _voucherSettings.Types.GiftCard,
                        customerId,
                        creditBreakdown.GiftCard,
                        currency,
                        voucherId,
                        meta,
                        allNewVouchers
                    );
                }

                if (creditBreakdown.Refund > 0)
                {
                    refundCode = await GetAndCreateCode(
                        _voucherSettings.Types.Refund,
                        customerId,
                        creditBreakdown.Refund,
                        currency,
                        voucherId,
                        meta,
                        allNewVouchers
                    );
                }

                if (creditBreakdown.Promo > 0)
                {
                    var amountToRefund = creditBreakdown.Promo;

                    for (int i = 0; amountToRefund > 0 && i < promoPayItems?.Length; i++)
                    {
                        var promoCreditRefundAmount = amountToRefund >= promoPayItems[i].Amount ? promoPayItems[i].Amount : amountToRefund;

                        var code = promoPayItems[i].PromoId;
                        var promoReason = promoPayItems[i].Reason;

                        code = await CreateAndPublishVoucher(
                            code,
                            promoCreditRefundAmount,
                            currency,
                            customerId,
                            meta,
                            promoReason,
                            promoPayItems[i].ExpirationDate);

                        allNewVouchers.Add(new CreatedVoucher { Code = code, Reason = promoReason, Amount = promoCreditRefundAmount });
                        amountToRefund = amountToRefund - promoCreditRefundAmount;
                    }
                }

                // Add a memo to the booking “Voucher created”
                if (allNewVouchers.Any())
                {
                    await AddCreditMemoToBooking(creditBreakdown.Total(), currency, booking, allNewVouchers.Select(x => x.Code).ToList());
                }

                // Add negative payment to reverse all money paid on the booking onto a payment type of “credit-issued” or "goodwill-issued"
                if (creditBreakdown.Goodwill > 0)
                {
                    await _bookingPaymentsRepository.AddCreditPaymentInfo(_voucherSettings.Types.Goodwill, -creditBreakdown.Goodwill,
                        booking.LeadPassenger, booking.BookingReference, booking.MarketCode, booking.Language, goodwillCode);
                }

                if (creditBreakdown.Refund > 0)
                {
                    await _bookingPaymentsRepository.AddCreditPaymentInfo(_voucherSettings.Types.Refund, -creditBreakdown.Refund,
                        booking.LeadPassenger, booking.BookingReference, booking.MarketCode, booking.Language, refundCode);
                }

                if (creditBreakdown.GiftCard > 0)
                {
                    await _bookingPaymentsRepository.AddCreditPaymentInfo(_voucherSettings.Types.GiftCard, -creditBreakdown.GiftCard,
                        booking.LeadPassenger, booking.BookingReference, booking.MarketCode, booking.Language, giftCardCode);
                }

                if (creditBreakdown.Promo > 0)
                {
                    var amountToRefund = creditBreakdown.Promo;

                    for (int i = 0; amountToRefund > 0 && i < promoPayItems?.Length; i++)
                    {
                        var promoCreditRefundAmount = amountToRefund >= promoPayItems[i].Amount ? promoPayItems[i].Amount : amountToRefund;

                        await _bookingPaymentsRepository.AddCreditPaymentInfo(promoPayItems[i].Reason, -promoCreditRefundAmount, booking.LeadPassenger,
                            booking.BookingReference, booking.MarketCode, booking.Language, promoPayItems[i].PromoId);

                        amountToRefund -= promoCreditRefundAmount;
                    }
                }

                // Mark booking as cancelled if booking not cancelled
                if (booking.BookingStatus != "CANCELED" && markBookingAsCancelled)
                {
                    await _bookingRepository.CancelBooking(booking.BookingReference, "Online credit process", true, booking.PromotionCollections);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Can not cancel booking {BookingReference}. Rolling back voucher", booking.BookingReference);

                // rollback and throw error, we don't need to go further
                await RollbackVouchers(booking, allNewVouchers);
                throw;
            }

            return allNewVouchers;
        }

        /// <summary>
        /// Adds vouchers to voucherify and atcom. Also updates booking with memo
        /// </summary>
        /// <param name="customerId"></param>
        /// <param name="bookingCancellationCreditRefundBreakdown"></param>
        /// <param name="voucherId"></param>
        /// <param name="booking"></param>
        /// <param name="meta"></param>
        /// <returns></returns>
        public async Task<List<CreatedVoucher>> CreateVouchersAndUpdateBooking(string customerId,
            BookingCancellationCreditRefundBreakdown bookingCancellationCreditRefundBreakdown,
            string voucherId,
            BookingResponse booking,
            Dictionary<string, object> meta)
        {
            ArgumentNullException.ThrowIfNull(booking);
            ArgumentNullException.ThrowIfNull(bookingCancellationCreditRefundBreakdown);
            ArgumentException.ThrowIfNullOrEmpty(voucherId);
            ArgumentException.ThrowIfNullOrEmpty(customerId);

            var createdVouchers = new List<CreatedVoucher>(); // collection of all new vouchers

            var currency = booking.PaymentInfo.Currency;
            try
            {
                var oneTimeUseCodes = await AddOneTimeUseVouchers(customerId, bookingCancellationCreditRefundBreakdown, voucherId, meta, currency, createdVouchers);
                var goodwillCodes = await AddVoucherWithPreviousCreditType(_voucherSettings.Types.Goodwill, customerId, bookingCancellationCreditRefundBreakdown.Goodwill, voucherId, meta, currency, createdVouchers, bookingCancellationCreditRefundBreakdown.GoodwillCreditMadeOf.Select(x => new MadeOfWithReason(x.MadeOfCode, x.Amount, _voucherSettings.Types.Goodwill)).ToList().AsReadOnly());
                var giftCardCodes = await AddVoucherWithPreviousCreditType(_voucherSettings.Types.GiftCard, customerId, bookingCancellationCreditRefundBreakdown.GiftCard, voucherId, meta, currency, createdVouchers, bookingCancellationCreditRefundBreakdown.GiftCardCreditMadeOf.Select(x => new MadeOfWithReason(x.MadeOfCode, x.Amount, _voucherSettings.Types.GiftCard)).ToList().AsReadOnly());
                var refundCodes = await AddVoucherWithPreviousCreditType(_voucherSettings.Types.Refund, customerId, bookingCancellationCreditRefundBreakdown.Refund, voucherId, meta, currency, createdVouchers, bookingCancellationCreditRefundBreakdown.RefundCreditMadeOf.Select(x => new MadeOfWithReason(x.MadeOfCode, x.Amount, _voucherSettings.Types.Refund)).ToList().AsReadOnly());

                List<PromoCreatedVoucherCode> promoCodes = await AddPromoVouchers(customerId, bookingCancellationCreditRefundBreakdown, voucherId, meta, currency, createdVouchers);

                // Add a memo to the booking “Voucher created”
                if (createdVouchers.Count > 0)
                {
                    await AddCreditMemoToBooking(bookingCancellationCreditRefundBreakdown.Total(), currency, booking, createdVouchers.Select(x => x.Code).ToList());
                }

                foreach (var oneTimeUseCode in oneTimeUseCodes)
                {
                    await AddCreditPaymentInfoToAtcom(booking, oneTimeUseCode.Amount, _voucherSettings.Types.OneTimeUse, oneTimeUseCode.Code);
                }
                // Add negative payment to reverse all money paid on the booking onto a payment type of “credit-issued” or "goodwill-issued"
                foreach (var goodwillCode in goodwillCodes)
                {
                    await AddCreditPaymentInfoToAtcom(booking, goodwillCode.Amount, _voucherSettings.Types.Goodwill, goodwillCode.Code);
                }

                foreach (var refundCode in refundCodes)
                {
                    await AddCreditPaymentInfoToAtcom(booking, refundCode.Amount, _voucherSettings.Types.Refund, refundCode.Code);
                }

                foreach (var giftCardCode in giftCardCodes)
                {
                    await AddCreditPaymentInfoToAtcom(booking, giftCardCode.Amount, _voucherSettings.Types.GiftCard, giftCardCode.Code);
                }

                if (HasPromoAmount(bookingCancellationCreditRefundBreakdown))
                {
                    foreach (var promoCode in promoCodes)
                    {
                        var code = promoCode.Code;
                        await _bookingPaymentsRepository.AddCreditPaymentInfo(promoCode.PromoRefundBreakdownItem.Reason, -promoCode.Amount, booking.LeadPassenger,
                            booking.BookingReference, booking.MarketCode, booking.Language, code);
                    }
                }
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Can not cancel booking {BookingReference}. Rolling back voucher", booking.BookingReference);

                await RollbackVouchers(booking, createdVouchers);
                throw new InvalidOperationException("Error while refund vouchers!",exception);
            }
            return createdVouchers;
        }

        /// <inheritdoc />
        public async Task<bool> RollbackVouchers(BookingResponse bookingResponse, IReadOnlyCollection<CreatedVoucher> vouchersToRollback)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);
            ArgumentNullException.ThrowIfNull(vouchersToRollback);

            // rollback and throw error, we don't need to go further
            bool successful = true;
            foreach (var voucher in vouchersToRollback)
            {
                try
                {
                    if (string.IsNullOrEmpty(voucher?.Code))
                        continue;

                    await _vouchersRepository.Delete(voucher.Code);
                    _logger.LogInformation("{Code} was deleted while rollback", voucher);

                    await _bookingPaymentsRepository.AddCreditPaymentInfo(voucher.Reason, voucher.Amount, bookingResponse.LeadPassenger, bookingResponse.BookingReference, bookingResponse.MarketCode, bookingResponse.Language, voucher.Code);
                    _logger.LogInformation("{Code} rollback was successfully transmitted to atcom", voucher);
                }
                catch (Exception rollbackEx)
                {
                    _logger.LogError(rollbackEx, "Can not rollback code {Code}", voucher);
                    successful = false;
                }
            }

            return successful;
        }

        private async Task<(decimal SummedAmount, List<CreatedVoucherCode> Codes)> AddOneTimeUseVouchersType(string customerId, string voucherId, ReadOnlyCollection<MadeOf> madeOf, Dictionary<string, object> meta, string currency, List<CreatedVoucher> createdVouchers, string reason)
        {
            if (madeOf.Count > 0)
            {
                var summedAmount =
                    madeOf.Sum(x =>
                        x.Amount);
                var codes = await AddVoucherWithPreviousCreditType(
                    _voucherSettings.Types.OneTimeUse,
                    customerId,
                    summedAmount,
                    $"{voucherId}-{reason}",
                    meta,
                    currency,
                    createdVouchers,
                    madeOf.Select(x => new MadeOfWithReason(x.MadeOfCode, x.Amount, reason)).ToList().AsReadOnly()
                );
                return (summedAmount, codes ?? new List<CreatedVoucherCode>());
            }
            return (0, new List<CreatedVoucherCode>());
        }

        internal async Task<List<CreatedVoucherCode>> AddOneTimeUseVouchers(string customerId,
            BookingCancellationCreditRefundBreakdown bookingCancellationCreditRefundBreakdown, string voucherId,
            Dictionary<string, object> meta, string currency, List<CreatedVoucher> createdVouchers)
        {
            decimal createdVouchersSum = 0;
            List<CreatedVoucherCode> codes = new List<CreatedVoucherCode>();

            var goodwill = await AddOneTimeUseVouchersType(
                customerId,
                voucherId,
                bookingCancellationCreditRefundBreakdown.OneTimeUseCreditStructure.GoodwillCreditMadeOf,
                meta,
                currency,
                createdVouchers,
                _voucherSettings.Types.Goodwill);
            if (goodwill.SummedAmount > 0)
            {
                createdVouchersSum += goodwill.SummedAmount;
                codes.AddRange(goodwill.Codes);
            }

            var refund = await AddOneTimeUseVouchersType(
                customerId,
                voucherId,
                bookingCancellationCreditRefundBreakdown.OneTimeUseCreditStructure.RefundCreditMadeOf,
                meta,
                currency,
                createdVouchers,
                _voucherSettings.Types.Refund);
            if (refund.SummedAmount > 0)
            {
                createdVouchersSum += refund.SummedAmount;
                codes.AddRange(refund.Codes);
            }

            var giftCard = await AddOneTimeUseVouchersType(
                customerId,
                voucherId,
                bookingCancellationCreditRefundBreakdown.OneTimeUseCreditStructure.GiftCardCreditMadeOf,
                meta,
                currency,
                createdVouchers,
                _voucherSettings.Types.GiftCard);
            if (giftCard.SummedAmount > 0)
            {
                createdVouchersSum += giftCard.SummedAmount;
                codes.AddRange(giftCard.Codes);
            }

            var oneTimeUse = await AddOneTimeUseVouchersType(
                customerId,
                voucherId,
                bookingCancellationCreditRefundBreakdown.OneTimeUseCreditStructure.OneTimeUseCreditMadeOf,
                meta,
                currency,
                createdVouchers,
                _voucherSettings.Types.OneTimeUse);
            if (oneTimeUse.SummedAmount > 0)
            {
                createdVouchersSum += oneTimeUse.SummedAmount;
                codes.AddRange(oneTimeUse.Codes);
            }

            if (bookingCancellationCreditRefundBreakdown.OneTimeUseCreditStructure.PromoCreditMadeOf.Count > 0)
            {
                var promoAmount =
                    bookingCancellationCreditRefundBreakdown.OneTimeUseCreditStructure.PromoCreditMadeOf.Sum(x =>
                        x.Amount);
                codes.AddRange(await AddVoucherWithPreviousCreditType(
                    _voucherSettings.Types.OneTimeUse,
                    customerId,
                    promoAmount,
                    $"{voucherId}-promo",
                    meta,
                    currency,
                    createdVouchers,
                    bookingCancellationCreditRefundBreakdown.OneTimeUseCreditStructure.PromoCreditMadeOf.Select(x => new MadeOfWithReason(x.MadeOfCode, x.Amount, x.Reason)).ToList().AsReadOnly()
                ));
                createdVouchersSum += promoAmount;
            }
            if (createdVouchersSum < bookingCancellationCreditRefundBreakdown.OneTimeUse)
            {
                var amount = bookingCancellationCreditRefundBreakdown.OneTimeUse - createdVouchersSum;
                var metaData = meta.DeepClone();
                metaData.Add(VoucherifyMetaKeys.PreviousCreditTypes, CashMadeOf);
                var createdVoucherCode = await AddVoucher(_voucherSettings.Types.OneTimeUse, customerId, amount, voucherId, metaData, currency, createdVouchers);
                if (createdVoucherCode != null)
                {
                    codes.Add(createdVoucherCode);
                }
            }

            return codes;
        }
        internal async Task<List<PromoCreatedVoucherCode>> AddPromoVouchers(string customerId,
            BookingCancellationCreditRefundBreakdown bookingCancellationCreditRefundBreakdown, string voucherId,
            Dictionary<string, object> meta, string currency, List<CreatedVoucher> createdVouchers)
        {
            List<PromoCreatedVoucherCode> promoCodes = new();
            if (HasPromoAmount(bookingCancellationCreditRefundBreakdown))
            {
                foreach (BookingCancellationPromoRefundBreakdownItem promoBreakdownItem in bookingCancellationCreditRefundBreakdown.PromoBreakdownItems)
                {
                    var code = GeneratePromoVoucherCode(voucherId, promoBreakdownItem);
                    for (int index = 0; index < promoBreakdownItem.MadeOf.Count; index++)
                    {
                        MadeOfWithReason madeOfWithReason = promoBreakdownItem.MadeOf[index];
                        var promoMeta = meta.DeepClone();
                        promoMeta.Add(VoucherifyMetaKeys.PreviousCreditTypes, GetPreviousCreditType(madeOfWithReason.MadeOfCode, madeOfWithReason.Reason));
                        var promoVoucherCode = await CreateAndPublishVoucher(
                            $"{code}-{index}",
                            madeOfWithReason.Amount,
                            currency,
                            customerId,
                            promoMeta,
                            promoBreakdownItem.Reason,
                            promoBreakdownItem.ExpirationDate);

                        promoCodes.Add(new PromoCreatedVoucherCode()
                        {
                            Code = promoVoucherCode,
                            Amount = madeOfWithReason.Amount,
                            PromoRefundBreakdownItem = promoBreakdownItem
                        });
                        createdVouchers.Add(new CreatedVoucher { Code = promoVoucherCode, Reason = promoBreakdownItem.Reason, Amount  = madeOfWithReason.Amount });
                    }
                }
            }

            return promoCodes;
        }

        internal async Task<List<CreatedVoucherCode>> AddVoucherWithPreviousCreditType(string reason, string customerId, 
            decimal voucherAmount, string voucherId, Dictionary<string, object> meta, string currency, 
            List<CreatedVoucher> createdVouchers, ReadOnlyCollection<MadeOfWithReason> creditMadeOf)
        {
            var codesWithAmount = new List<CreatedVoucherCode>();
            if (creditMadeOf.Count != 0)
            {
                for (int index = 0; index < creditMadeOf.Count; index++)
                {
                    MadeOfWithReason madeOf = creditMadeOf[index];
                    var metaData = meta.DeepClone();
                    metaData.Add(VoucherifyMetaKeys.PreviousCreditTypes,
                        GetPreviousCreditType(madeOf.MadeOfCode, madeOf.Reason));

                    var createdVoucherCode = await AddVoucher(reason, customerId, madeOf.Amount, $"{voucherId}-{index+1}", metaData,
                        currency, createdVouchers);
                    if (createdVoucherCode != null)
                    {
                        codesWithAmount.Add(createdVoucherCode);
                    }
                }

                if (voucherAmount > creditMadeOf.Sum(x => x.Amount))
                {
                    var amount = voucherAmount - creditMadeOf.Sum(x => x.Amount);
                    var metaData = meta.DeepClone();
                    metaData.Add(VoucherifyMetaKeys.PreviousCreditTypes, GetPreviousCreditType(CashMadeOf, reason));
                    
                    var createdVoucherCode = await AddVoucher(reason, customerId, amount, voucherId, metaData, currency, createdVouchers);
                    if (createdVoucherCode != null)
                    {
                        codesWithAmount.Add(createdVoucherCode);
                    }
                }
            }
            else
            {
                var metaData = meta.DeepClone();
                metaData.Add(VoucherifyMetaKeys.PreviousCreditTypes, GetPreviousCreditType(CashMadeOf, reason));
                var createdVoucherCode = await AddVoucher(reason, customerId, voucherAmount, voucherId, metaData, currency, createdVouchers);
                if (createdVoucherCode != null)
                {
                    codesWithAmount.Add(createdVoucherCode);
                }
            }

            return codesWithAmount;
        }

        private const string CashMadeOf = "cash";

        private static string GetPreviousCreditType(string creditMadeOf, string creditType)
        {
            if (creditMadeOf == CashMadeOf)
            {
                return creditMadeOf;
            }
            return $"{creditType}[{creditMadeOf}]";
        }

        private async Task AddCreditPaymentInfoToAtcom(BookingResponse booking, decimal amount, string voucherType, string voucherId)
        {
            if (amount > 0)
            {
                await _bookingPaymentsRepository.AddCreditPaymentInfo(voucherType, -amount,
                    booking.LeadPassenger, booking.BookingReference, booking.MarketCode, booking.Language, voucherId);
            }
        }

        private async Task<CreatedVoucherCode> AddVoucher(string reason, string customerId, decimal voucherAmount, string voucherId, Dictionary<string, object> meta, string currency, List<CreatedVoucher> createdVouchers)
        {
            if (voucherAmount > 0)
            {
                var code = await GetAndCreateCode(
                    reason,
                    customerId,
                    voucherAmount,
                    currency,
                    voucherId,
                    meta,
                    createdVouchers
                );

                if (code != null)
                {
                    return new CreatedVoucherCode
                    {
                        Code = code,
                        Amount = voucherAmount
                    };
                }
            }

            return null;
        }

        private static string GeneratePromoVoucherCode(string voucherId, BookingCancellationPromoRefundBreakdownItem promoBreakdownItem)
        {
            return $"{voucherId}-{promoBreakdownItem.PromoId}-promo";
        }

        private static bool HasPromoAmount(BookingCancellationCreditRefundBreakdown bookingCancellationCreditRefundBreakdown)
        {
            return bookingCancellationCreditRefundBreakdown.PromoBreakdownItems.Sum(i => i.Amount) > 0;
        }

        private async Task<string> GetAndCreateCode(string reason, string customerId, decimal credit, string currency, string voucherId,
            Dictionary<string, object> meta, List<CreatedVoucher> createdVouchers)
        {
            string code = BuildCode(reason, voucherId);
            code = await CreateAndPublishVoucher(
                code,
                credit,
                currency,
                customerId,
                meta,
                reason
            );
            createdVouchers.Add(new CreatedVoucher { Code = code, Reason = reason, Amount = credit});
            return code;
        }

        internal static string BuildCode(string typeOfCode, string voucherId)
        {
            return $"{voucherId}-{typeOfCode}";
        }

        /// <inheritdoc/>
        public async Task<List<string>> AddRefundCreditToBooking(string customerId, decimal refundAmount, string currency,
            string voucherId, BookingResponse booking, Dictionary<string, object> meta)
        {
            var createdVoucherCodes =
                new List<string>(); // collection of codes which should be rolled back in case of any errors
            var allNewVouchersCodes = new List<string>(); // collection of all new voucher codes

            try
            {
                string refundCode = null;

                if (refundAmount > 0)
                {
                    refundCode = $"{voucherId}-{_voucherSettings.Types.Refund}";
                    var refundVoucherCode = await CreateAndPublishVoucher(
                        refundCode,
                        refundAmount,
                        currency,
                        customerId,
                        meta,
                        _voucherSettings.Types.Refund
                    );
                    createdVoucherCodes.Add(refundVoucherCode);
                    allNewVouchersCodes.Add(refundCode);
                }

                // Add a memo to the booking “Voucher created”
                await AddCreditMemoToBooking(refundAmount, currency, booking, allNewVouchersCodes);

                if (refundAmount > 0)
                {
                    await _bookingPaymentsRepository.AddCreditPaymentInfo(_voucherSettings.Types.Refund, -refundAmount,
                        booking.LeadPassenger, booking.BookingReference, booking.MarketCode, booking.Language, refundCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Can not cancel booking {LogSanitizer.SanitizeNewLines(booking.BookingReference)}. Rolling back voucher");

                // rollback and throw error, we don't need to go further                    
                var codesToRollback = createdVoucherCodes.Where(x => !string.IsNullOrEmpty(x)).ToList();
                foreach (var code in codesToRollback)
                {
                    try
                    {
                        await _vouchersRepository.Delete(code);
                    }
                    catch (Exception rollbackEx)
                    {
                        _logger.LogError(rollbackEx, $"Can not rollback code {code}");
                    }
                }

                throw;
            }

            return allNewVouchersCodes;
        }

        /// <inheritdoc />
        public async Task<string> CreateAndPublishVoucher(string voucherId, decimal amount, string currency, string customerId,
            Dictionary<string, object> meta, string reasonCode, DateTimeOffset? expirationDate = null)
        {
            var combinedMeta = meta.DeepClone();
            combinedMeta[VoucherifyMetaKeys.Reason] = reasonCode;

            var expiration = DetermineExpiration(reasonCode, expirationDate);

            var createResult = await _vouchersRepository.Create(voucherId, combinedMeta, null, expiration);
            VVoucherify.DataModel.Voucher voucher = createResult;
            try
            {
                await _vouchersRepository.AddVoucherGiftBalance(voucherId, (int)Math.Ceiling(amount * 100));

                // Handle only publish because we need to rollback
                await _vouchersRepository.Publish(voucherId, customerId);
                return voucherId;
            }
            catch (Exception ex)
            {
                if (ex is ApiException exception && exception.Code.Code == ApiExceptionCodes.VoucherAddBalance.Code)
                {
                    _logger.LogError(exception, "Can not add balance {Amount} {Currency} to {VoucherCode} for {CustomerId}", amount, currency, voucher.Code, customerId);
                }
                else
                {
                    _logger.LogError(ex, "Can not publish voucher {VoucherCode} for {CustomerId}", voucher.Code, customerId);
                }

                // rollback and throw error, we don't need to go further
                // but do it only voucher was created by us, otherwise don't delete it (don't touch any existing data)
                await _vouchersRepository.Delete(voucher.Code);

                throw;
            }
        }

        private DateTimeOffset? DetermineExpiration(string reasonCode, DateTimeOffset? expirationDate)
        {
            DateTimeOffset BuildDefaultExpiry() => DateTimeOffset.UtcNow.AddMonths(_voucherSettings.ExpirationMonths);


            if (expirationDate.HasValue)
                return expirationDate.Value;

            if (_validPromoCodes.Contains(reasonCode))
            {
                try
                {
                    var settings = _apiSettingsService.GetPaymentCodesSettingsByReason(reasonCode);
                    if (settings?.ExpirationDate.HasValue ?? false)
                        return settings.ExpirationDate;

                }
                catch (Exception)
                {
                    // we don't want to break on missing new promotions and will just follow the default flow instead.
                }

                return BuildDefaultExpiry();
            }
            if (_validReasonCodes.Contains(reasonCode))
            {
                return BuildDefaultExpiry();
            }

            // This really shouldn't happen, as reason should be validated beforehand. 
            // Therefore, reasonCode should always be part of either of the two sets.
            return null;
        }

        /// <inheritdoc />
        public async Task<Dictionary<Currency, MyCreditInfo>> MyCredits(string custId = null, bool force = false)
        {
            var customerId = custId ?? await _authenticationService.GetCustomerIdWithErrorsHandling();
            var credits =
                await _awsUserCreditsService.GetOrUpdateUserCredits(customerId, async () => await MyCredit(customerId),
                    force);
            _logger.LogInformation(
                $"Credits for {customerId}, force={force}: {string.Join(" | ", credits.Select(credit => $"{credit.Key.Code}: {credit.Value.Balance}, History: {credit.Value.HasCreditHistory}"))}");

            return credits;
        }

        private async Task<Dictionary<Currency, MyCreditInfo>> MyCredit(string custId = null)
        {
            var customerId = custId ?? await _authenticationService.GetCustomerIdWithErrorsHandling();
            var myCredits = await MyCreditItems(customerId);
            var myCreditsHistory = await MyCreditHistoryInternal(customerId, myCredits);

            return myCredits
                .ToDictionary(
                    x => x.Key,
                    x =>
                    {
                        var validCredits = x.Value.Where(creditItem => creditItem.Expires == null || creditItem.Expires > DateTime.Now);
                        var balance = validCredits.Sum(creditItem => creditItem.Balance);
                        var history = myCreditsHistory.GetValueOrDefault(x.Key);

                        return new MyCreditInfo()
                        {
                            Balance = balance,
                            HasCreditHistory = history?.Count() > 0,
                            Currency = x.Key.Code,
                        };
                    });
        }

        /// <summary>
        /// Get credit amount for current logged in customer
        /// </summary>
        /// <returns></returns>
        public async Task<Dictionary<Currency, IEnumerable<CreditItem>>> MyCreditItems(string custId = null)
        {
            var customerId = custId ?? await _authenticationService.GetCustomerIdWithErrorsHandling();
            var vouchers = await _customersRepository.GetCustomerVouchers(customerId);

            return vouchers?
                .Where(voucher => voucher.Active)
                .GroupBy(voucher => voucher.GetCurrency())
                .ToDictionary(
                    x => x.Key,
                    x => x.Select(voucher => new CreditItem()
                    {
                        Id = voucher.Code,
                        Amount = ConvertVoucherAmountToDecimal(voucher.Gift?.Amount),
                        Balance = ConvertVoucherAmountToDecimal(voucher.Gift?.Balance),
                        Expires = voucher.ExpirationDate,
                        StartDate = voucher.StartDate,
                        CreatedAt = voucher.CreatedAt,
                        Metadata = voucher.Metadata?.Select(pair => new Data.Vouchers.KeyValuePair()
                        {
                            Key = pair.Key,
                            Value = pair.Value,
                        })
                    }));
        }

        /// <inheritdoc />
        public async Task<Dictionary<Currency, CreditHistoryItem[]>> MyCreditHistory(string custId = null) 
            => await MyCreditHistoryInternal(custId);

        private DateTime GetLastOperationDateForExpiredOrUsedVouchers()
        {
            return DateTime.UtcNow.AddYears(-_voucherifySettings.ShowExpiredAndUsedVouchersInYears);
        }

        private async Task<Dictionary<Currency, CreditHistoryItem[]>> MyCreditHistoryInternal(string custId = null,
            Dictionary<Currency, IEnumerable<CreditItem>> customerCredits = null)
        {
            var customerId = custId ?? await _authenticationService.GetCustomerIdWithErrorsHandling();
            var redemptions = await _customersRepository.GetCustomerHistory(customerId);
            var lastOperationDateForExpiredOrUsedVouchers = GetLastOperationDateForExpiredOrUsedVouchers();

            var myCredits = customerCredits ?? await MyCreditItems(customerId);

            var myCreditsHistory = myCredits
                .ToDictionary(
                    x => x.Key,
                    x => x.Value.Select(item => new CreditHistoryItem()
                    {
                        Id = item.Id,
                        VoucherID = item.Id,
                        Metadata = item.Metadata,
                        CreatedAt = item.CreatedAt,
                        Expires = item.Expires,
                        Order = new OrderItem()
                        {
                            Amount = item.Amount,
                            Date = item.CreatedAt,
                        },
                        Redemptions = redemptions.Redemptions?.Where(red => red.Voucher?.Code == item.Id).Select(red =>
                            new CreditHistoryItem()
                            {
                                Id = red.Id,
                                Type = red.Object,
                                VoucherID = red.Voucher?.Code,
                                FailureCode = red.FailureCode,
                                Result = red.Result,
                                Metadata = red.Metadata?.Select(r => new Data.Vouchers.KeyValuePair()
                                {
                                    Key = r.Key,
                                    Value = r.Value,
                                }),
                                Order = new OrderItem()
                                {
                                    Amount = -ConvertVoucherAmountToDecimal(red.Gift?.Amount),
                                    Date = red.Order?.CreatedAt,
                                    Id = red.Order?.Id,
                                    Status = red.Order?.Status,
                                }
                            })

                    })
                        //Show not used vouchers or used or expired from last 2 years
                        .Where(creditHistoryItem => (creditHistoryItem.Amount != 0 && (creditHistoryItem.Expires ?? DateTime.UtcNow) >= lastOperationDateForExpiredOrUsedVouchers)
                                  || (creditHistoryItem.Amount == 0 && creditHistoryItem.LastOperationAt >= lastOperationDateForExpiredOrUsedVouchers)
                    ).ToArray());

            return myCreditsHistory;
        }

        /// <inheritdoc />
        public async Task<List<CreditSpend>> SpendFilteredCredits(decimal amount, Currency currency, string bookingReference, string accomCode, string bookingMarketCode,
            string customerId = null, RedemptionMetadata redemptionMetadata = null)
        {
            try
            {
                if (string.IsNullOrEmpty(customerId))
                    customerId = await _authenticationService.GetCustomerIdWithErrorsHandling();

                var currencyCredits = await GetCreditHierarchy(currency, bookingMarketCode, customerId);

                //We place the current booking's voucher at the beginning of the hierarchy
                //to avoid mixing it up with vouchers from other bookings,
                //in case the client has multiple bookings
                currencyCredits = currencyCredits
                    .Where(ExcludePromoVouchers)
                    .OrderByDescending(x => string.Equals(x.GetBookingRefFromMeta(), bookingReference, StringComparison.OrdinalIgnoreCase))
                    .ThenBy(x => currencyCredits.IndexOf(x))
                    .ToList();

                return await SpendCredit(amount, currency, bookingReference, accomCode, customerId, redemptionMetadata, currencyCredits);
            }
            catch (Exception ex)
            {
                if (ex is VoucherRedeemExeption) throw;
                throw new VoucherRedeemExeption(ApiExceptionCodes.CreditsFailedRedeem);
            }
        }

        /// <inheritdoc />
        public async Task<List<CreditSpend>> SpendCredits(decimal amount, Currency currency, string bookingReference, string accomCode, string bookingMarketCode,
            string customerId = null, RedemptionMetadata redemptionMetadata = null)
        {
            try
            {
                if (string.IsNullOrEmpty(customerId))
                {
                    customerId = await _authenticationService.GetCustomerIdWithErrorsHandling();
                }
                var currencyCredits = await GetCreditHierarchy(currency, bookingMarketCode, customerId);
                return await SpendCredit(amount, currency, bookingReference, accomCode, customerId, redemptionMetadata, currencyCredits);
            }
            catch (Exception ex)
            {
                if (ex is VoucherRedeemExeption) throw;
                throw new VoucherRedeemExeption(ApiExceptionCodes.CreditsFailedRedeem);
            }
        }

        /// <inheritdoc />
        public async Task<List<CreditItem>> GetCreditHierarchy(Currency currency, string bookingMarketCode, string customerId = null)
        {
            var myCredits = await MyCreditItems(customerId);
            var currencyCredits = myCredits[currency];

            var defaultMarketCode = (currencyCredits ?? [])
                    .Where(x => x.GetMarketFromMeta() != null)
                    .GroupBy(x => x.GetMarketFromMeta())
                    .OrderByDescending(g => g.Count())
                    .Select(g => g.Key)
                    .FirstOrDefault();
            currencyCredits = (currencyCredits ?? [])
                    .Where(x => x.Balance > 0 && (x.Expires == null || x.Expires > DateTime.Now))
                    .OrderByDescending(x => (x.GetMarketFromMeta() ?? defaultMarketCode) == bookingMarketCode)
                    .ThenByDescending(x => x.GetReasonFromMeta() == _voucherSettings.Types.OneTimeUse)
                    .ThenBy(x => x.Expires)
                    .ThenBy(x => x.Balance);
            // Exclude vouchers without positive balance and order voucher by market then by expiration date
            return currencyCredits.ToList();
        }

        private bool ExcludePromoVouchers(CreditItem creditItem)
        {
            return !_voucherSettings.PromoVouchers?.Types?.Any(type => string.Equals(creditItem.GetReasonFromMeta(), type, StringComparison.OrdinalIgnoreCase)) ?? true;
        }

        /// <inheritdoc />
        public async Task RollBackCreditRedemptions(IEnumerable<string> redemptionIDs, string reason,
            string customerId = null)
        {
            // Does not process roll back if no redemptions have been successful.
            var iDs = redemptionIDs?.ToList() ?? [];
            if (iDs is not [])
            {
                customerId ??= await _authenticationService.GetCustomerIdWithErrorsHandling();

                var rollBackTasks =
                    await Task.WhenAll(iDs.Select(x => RollBackRedemption(x, reason, customerId)).ToArray());
                if (rollBackTasks.Any(x => !x.IsSuccess))
                {
                    throw new ApiException(ApiExceptionCodes.CreditsFailedToRollBackRedemption);
                }
            }
        }

        /// <inheritdoc />
        public async Task RollBackDiscountRedemptions(string voucherCode, IEnumerable<string> redemptionIDs,
            string reason)
        {
            var iDs = redemptionIDs?.ToList() ?? [];
            if (iDs is not [])
            {
                var rollBackTasks =
                    await Task.WhenAll(iDs.Select(x => RollBackRedemption(x, reason, null)).ToArray());
                if (rollBackTasks.Any(x => !x.IsSuccess))
                {
                    throw new ApiException(ApiExceptionCodes.DiscountFailedToRollBackRedemption);
                }
            }

            await _vouchersRepository.UpdateDetails(voucherCode, new Dictionary<string, object>
            {
                {VoucherifyMetaKeys.BookingRef, string.Empty}
            }, null);
        }

        /// <inheritdoc />
        public async Task<bool> UpdateCustomerSourceId(Data.Authentication.CustomerDetails customerDetails)
        {
            try
            {
                if (customerDetails == null)
                {
                    return false;
                }

                var byEmail =
                    await _customersRepository.GetCustomersByEmail(customerDetails.Email,
                        5); // get up to 5 top rows in case we have duplicates
                var customers = byEmail?.Customers;
                if (customers == null || customers.Count == 0)
                {
                    _logger.LogInformation("Customer doesn't exist in Voucherify system: {Email}", customerDetails.Email);
                    return false;
                }

                // customer sourceId might be set to their email to prevent duplicate account creation during concurrent bulktool operations, see: BOA-302/BOA-326
                var customerWithValidSourceId =
                    customers.FirstOrDefault(x => x.Id != x.SourceId && !string.IsNullOrEmpty(x.SourceId) && !string.Equals(x.SourceId, x.Email, StringComparison.InvariantCultureIgnoreCase));
                if (customerWithValidSourceId != null)
                {
                    _logger.LogInformation("Customer already has valid sourceId: {Email}", customerDetails.Email);
                    return false;
                }

                var customer =
                    customers.FirstOrDefault(); // Take first: it will have sourceId==ID or empty sourceId or sourceId==email, we accept any

                var sourceId = await _authenticationService.GetCustomerIdWithErrorsHandling(customerDetails);
                _logger.LogInformation(
                    "Updating source id for customer {Email}, new source id: {SourceId}", customerDetails.Email, sourceId);
                await _customersRepository.Update(customer?.Id, sourceId,
                    $"{customerDetails.FirstName} {customerDetails.LastName}");

                // And clear credits cache to make sure we get latest
                try
                {
                    await _awsUserCreditsService.ClearUserCreditsInfo(sourceId);
                }
                catch (Exception e)
                {
                    // Don't need to throw error if failed to clear cache
                    _logger.LogError(e, "Failed to clear credits cache for {SourceId}", sourceId);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in updating customer id");
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<TransferResult> TransferVouchers(string customerFromId, string customerToId, string currency,
            Func<IEnumerable<VoucherWithCustomer>, IEnumerable<VoucherWithCustomer>>
                getVouchersToMove)
        {
            if (string.IsNullOrEmpty(customerFromId) || string.IsNullOrEmpty(customerToId))
            {
                throw new ArgumentNullException(nameof(customerFromId) + nameof(customerToId), "Source and target customers shouldn't be empty");
            }

            var creditsFrom = await _customersRepository.GetCustomerVouchers(customerFromId);
            var creditsTargetCustomer = await _customersRepository.GetCustomerVouchers(customerToId);
            if (creditsFrom == null || creditsTargetCustomer == null)
            {
                throw new ApiException(ApiExceptionCodes.CreditsTransferNoCustomer, "Cannot get customer", null, null);
            }

            var vouchersToMove = creditsFrom
                .Where(voucher => voucher.Active)
                .Where(voucher => voucher.ExpirationDate == null || voucher.ExpirationDate > DateTime.Now)
                .Where(voucher => voucher.GetCurrency().Code == currency)
                .Where(voucher => (voucher.Redemption.RedeemedQuantity ?? 0) == 0) // no redemptions
                .Where(voucher => voucher.Gift.Amount == voucher.Gift.Balance) // balance is not changed
                .ToList();
            if (!vouchersToMove.Any())
            {
                throw new ApiException(ApiExceptionCodes.CreditsTransferNoVouchers);
            }

            if (getVouchersToMove != null)
            {
                vouchersToMove = getVouchersToMove(vouchersToMove).ToList();
                if (!vouchersToMove.Any())
                {
                    throw new ApiException(ApiExceptionCodes.CreditsTransferNoVouchersSubset);
                }
            }

            var policy = BuildPolicy();
            var result = new TransferResult
            {
                Successfull = new List<string>(),
                Failed = new List<string>()
            };
            var additionalMetadata = new Dictionary<string, string> { { "transferred_from", customerFromId } };
            foreach (var voucher in vouchersToMove)
            {
                try
                {
                    await _vouchersRepository.Delete(voucher.Code);
                    // Clone is the most important part, lets make sure we try multiple times before throwing error
                    var exResult =
                        await policy.ExecuteAndCaptureAsync(
                            () => _vouchersRepository.Clone(voucher, additionalMetadata));
                    if (exResult.Outcome == OutcomeType.Failure)
                    {
                        throw exResult.FinalException;
                    }

                    await _vouchersRepository.Publish(voucher.Code, customerToId);

                    result.Successfull.Add($"{voucher.Code},{voucher.GetCurrency().Code}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Unexpected error during cloning {voucher.Code}.");
                    result.Failed.Add(voucher.Code);
                }
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<ValidateVoucher> Validate(string voucherCode)
        {
            if (string.IsNullOrWhiteSpace(voucherCode)) throw new ArgumentNullException(nameof(voucherCode));

            Voucher voucher;

            try
            {
                voucher = await _vouchersRepository.Get(voucherCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Can't find voucher with code: {LogSanitizer.SanitizeNewLines(voucherCode)}");
                throw new ApiException(ApiExceptionCodes.VoucherNotFound,
                    $"Voucher with code: {voucherCode} was not found ", null, ex.InnerException,
                    HttpStatusCode.NotFound);
            }

            //voucher must be not null, have gift type and not empty campaign
            if (voucher == null || string.IsNullOrWhiteSpace(voucher.Campaign))
            {
                throw new ApiException(ApiExceptionCodes.VoucherInvalid, $"Voucher with code: {voucherCode} is invalid",
                    null, null, HttpStatusCode.BadRequest);
            }

            //must be active and not expired
            if (!voucher.Active || voucher.ExpirationDate < DateTime.UtcNow || voucher.StartDate > DateTime.UtcNow)
            {
                throw new ApiException(ApiExceptionCodes.VoucherNotActiveOrExpired,
                    $"Voucher with code: {voucherCode} is not active or expired", null, null,
                    HttpStatusCode.BadRequest);
            }

            switch (voucher.Type)
            {
                case VoucherType.DiscountVoucher:
                    {
                        return ValidateDiscountVoucher(voucherCode, voucher);
                    }
                case VoucherType.GiftVoucher:
                    {
                        return await ValidateGiftVoucher(voucherCode, voucher);
                    }
                default:
                    {
                        throw new ApiException(ApiExceptionCodes.VoucherInvalid,
                            $"Voucher with code: {voucherCode} is invalid", null, null, HttpStatusCode.BadRequest);
                    }
            }
        }

        /// <inheritdoc/>
        public async Task<ValidateVoucher> ConvertVoucherToCredits(string voucherCode)
        {
            if (string.IsNullOrWhiteSpace(voucherCode)) throw new ArgumentNullException(nameof(voucherCode));

            //we have to validate voucher before redeeming, because currently we allow converting only custom campaign vouchers
            //also we should get amount of the voucher
            var validateVoucher = await Validate(voucherCode);

            var customerDetails = await _authenticationService.CustomerDetails();

            var customerId = await _authenticationService.MappedCustomerId(customerDetails);

            Redemption voucherRedemption = null;
            PolicyResult<Voucher> retryPolicyResult = null;

            try
            {
                //get customer from voucherify
                var voucherifyCustomer = await _customersRepository.GetOrCreate(customerId, customerDetails);

                var voucherifyCustomerId = voucherifyCustomer.SourceId ?? voucherifyCustomer.Id;

                DateTimeOffset? newVoucherExpirationData = null;

                //get new expiration date from metadata
                if (validateVoucher.Metadata.TryGetValue(VoucherifyMetaKeys.Expiration, out var expirationDaysMetaData))
                {
                    if (int.TryParse(expirationDaysMetaData as string, out var voucherExpirationDays))
                    {
                        newVoucherExpirationData = DateTimeOffset.UtcNow.AddDays(voucherExpirationDays);
                    }
                }

                voucherRedemption = await _vouchersRepository.ProcessRedemption(voucherCode, validateVoucher.Amount, voucherifyCustomerId);

                var redeemedVoucher = voucherRedemption.Voucher;

                //e.g. redeemed voucher code = SZFdoAOK and Campaign = "Walker Crisps Test" -> SZFdoAOK-Walker-Crisps-Test
                var newVoucherCode = $"{redeemedVoucher.Code}-{redeemedVoucher.Campaign.Trim().Replace(" ", "-")}";

                //configuring new required metadata
                redeemedVoucher.Metadata[VoucherifyMetaKeys.Source] = redeemedVoucher.Campaign;
                redeemedVoucher.Metadata[VoucherifyMetaKeys.OriginalVoucherCode] = voucherCode;

                redeemedVoucher.Metadata.Remove(_voucherSettings.CustomCampaignVouchersMetaData);
                redeemedVoucher.Metadata.Remove(VoucherifyMetaKeys.Expiration);

                var asyncRetryPolicy = BuildPolicy();

                //trying hard to create clone of redeemed voucher with new code, metadata and expiration date inside ej campaign
                //retryPolicyResult = await asyncRetryPolicy.ExecuteAndCaptureAsync(() =>
                //    _vouchersRepository.CreateOrGet(newVoucherCode, redeemedVoucher.Metadata,
                //        ConvertVoucherAmountToDecimal(voucherRedemption.Amount), newVoucherExpirationData));
                retryPolicyResult = await asyncRetryPolicy.ExecuteAndCaptureAsync(() =>
                    _vouchersRepository.Create(newVoucherCode, redeemedVoucher.Metadata,
                        ConvertVoucherAmountToDecimal(voucherRedemption.Amount), newVoucherExpirationData));

                if (retryPolicyResult.Outcome == OutcomeType.Failure)
                {
                    throw retryPolicyResult.FinalException;
                }

                //attach a new voucher to the customer
                var newVoucherPublication = await _vouchersRepository.Publish(retryPolicyResult.Result.Code, voucherifyCustomerId);

                //everything went fine. we should add metadata who has redeemed voucher
                validateVoucher.Metadata.Add(VoucherifyMetaKeys.RedeemedBy, voucherifyCustomerId);
                await _vouchersRepository.UpdateDetails(voucherCode, validateVoucher.Metadata, null);

                var userCurrentBalance = await GetUserCreditBalance(validateVoucher.GetCurrency(), customerId);

                try
                {
                    await _awsUserCreditsService.ClearUserCreditsInfo(customerId);
                }
                catch (Exception e)
                {
                    // Suppress error if failed to clear cache
                    _logger.LogError(e, "Failed to clear credits cache for {CustomerId}", customerId);
                }

                return new ValidateVoucher()
                {
                    VoucherCode = newVoucherPublication?.Voucher?.Code,
                    Active = newVoucherPublication?.Voucher?.Active ?? false,
                    ExpirationDate = newVoucherPublication?.Voucher?.ExpirationDate,
                    Amount = ConvertVoucherAmountToDecimal(newVoucherPublication?.Voucher?.Gift?.Balance),
                    Campaign = newVoucherPublication?.Voucher?.Campaign,
                    VoucherType = Data.Vouchers.VoucherType.GIFT_VOUCHER,
                    UserCurrentBalance = userCurrentBalance,
                    Currency = validateVoucher.Currency
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to redeem voucher with code: {VoucherCode}", voucherCode);

                //roll back only if the old voucher has been redeemed and a new one has not been created  
                if (voucherRedemption != null && retryPolicyResult?.Outcome != OutcomeType.Successful)
                {
                    await RollBackRedemption(voucherRedemption.Id, $"Failed to transfer voucher with code: {voucherCode} to user credit",
                        customerId);
                }

                throw new ApiException(ApiExceptionCodes.FailedRedeemVoucher, $"Failed to redeem voucher with code: {voucherCode}", null, ex.InnerException);
            }
        }

        private ValidateVoucher ValidateDiscountVoucher(string voucherCode, Voucher voucher)
        {
            //check if the voucher is a single promo code
            //single promo must have discount metadata
            voucher.Metadata.TryGetValue(_voucherSettings.Discounts.MetadataKey, out var discountCodeObject);

            var discountCodeMetadata = discountCodeObject as string;

            if (string.IsNullOrWhiteSpace(discountCodeMetadata))
            {
                throw new ApiException(ApiExceptionCodes.VoucherInvalid,
                    $"Voucher with code: {voucherCode} is invalid", null, null, HttpStatusCode.BadRequest);
            }

            return new ValidateVoucher()
            {
                VoucherCode = voucherCode,
                Active = true,
                VoucherType = Data.Vouchers.VoucherType.PROMO_VOUCHER
            };
        }

        private async Task<ValidateVoucher> ValidateGiftVoucher(string voucherCode, Voucher voucher)
        {
            //check if the voucher is a gift card
            //gift card must have have custom campaign metadata
            if (!voucher.TryGetFromMetadata(_voucherSettings.CustomCampaignVouchersMetaData, out string customCampaignMetadata)
                || string.IsNullOrWhiteSpace(customCampaignMetadata))
            {
                throw new ApiException(ApiExceptionCodes.VoucherInvalid, $"Voucher with code: {voucherCode} is invalid",
                    null, null, HttpStatusCode.BadRequest);
            }

            var mappedCustomerId = await _authenticationService.MappedCustomerId();

            //check the metadata to see if the voucher was redeemed by someone
            voucher.Metadata.TryGetValue(VoucherifyMetaKeys.RedeemedBy, out var redeemedByObject);

            var redeemedBy = redeemedByObject as string;

            var voucherIsRedeemed = !string.IsNullOrEmpty(redeemedBy) || voucher.Gift?.Balance == 0;

            if (voucherIsRedeemed)
            {
                //user is authorized -> we can check whether the voucher has been redeemed by current user
                if (mappedCustomerId != null && !string.IsNullOrEmpty(redeemedBy))
                {
                    if (mappedCustomerId == redeemedBy)
                    {
                        throw new ApiException(ApiExceptionCodes.VoucherRedeemedAlreadyByYou,
                            $"Voucher with code: {voucherCode} has been already redeemed by you", null, null,
                            HttpStatusCode.BadRequest);
                    }
                }

                throw new ApiException(ApiExceptionCodes.VoucherRedeemedAlready,
                    $"Voucher with code: {voucherCode} has been already redeemed", null, null,
                    HttpStatusCode.BadRequest);
            }

            decimal? userCurrentBalance = null;

            //we can get the client's balance only if he is authorized
            if (mappedCustomerId != null)
            {
                userCurrentBalance = await GetUserCreditBalance(voucher.GetCurrency(), mappedCustomerId);
            }

            var voucherAmount = ConvertVoucherAmountToDecimal(voucher.Gift?.Balance);

            return new ValidateVoucher()
            {
                VoucherCode = voucher.Code,
                Active = voucher.Active,
                ExpirationDate = voucher.ExpirationDate,
                Amount = voucherAmount,
                Campaign = voucher.Campaign,
                VoucherType = Data.Vouchers.VoucherType.GIFT_VOUCHER,
                UserCurrentBalance = userCurrentBalance,
                UserNewBalance = userCurrentBalance + voucherAmount,
                Metadata = voucher.Metadata,
                Currency = voucher.GetCurrency().Code
            };
        }

        private Polly.Retry.AsyncRetryPolicy BuildPolicy()
        {
            var policy = Policy.Handle<Exception>().WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: _ => TimeSpan.FromMilliseconds(200), // Wait 200ms between each try.,
                onRetry: (exception, _) => // Capture some info for logging!
                {
                    _logger.LogError(exception, "Got error executing request");
                }
            );
            return policy;
        }

        /// <summary>
        /// Adds CRED and REP3 memos to booking with voucher information
        /// </summary>
        /// <param name="refundAmount"></param>
        /// <param name="currency">Currency of created voucher, to be used in memo description</param>
        /// <param name="booking"></param>
        /// <param name="vouchers"></param>
        /// <returns></returns>
        private async Task AddCreditMemoToBooking(decimal refundAmount, string currency, BookingResponse booking,
            List<string> vouchers)
        {
            var newVouchersString = string.Join(", ", vouchers.ToArray());
            await _bookingRepository.ModifyMemo(booking.BookingReference, new BookingMemo
            {
                Code = _voucherSettings.BookingMemos.Cred.Code,
                Description =
                    $"{_voucherSettings.BookingMemos.Cred.Description} with ids: {newVouchersString}, {refundAmount} {currency}"
            });
        }

        private static readonly Regex MemoDescriptionRefundAmountRegex = new(@".*?(\d+(?:\.\d+)?)\s+[A-Z]{3}$", RegexOptions.Compiled, TimeSpan.FromSeconds(1));

        /// <inheritdoc />
        public decimal? GetRefundAmountFromCreditRefundMemo(BookingResponse bookingResponse)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);

            var memoDescription = bookingResponse.Memo?.LastOrDefault(i => i.Code == _voucherSettings.BookingMemos.Cred.Code);
            if (memoDescription == null)
                return null;

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

        /// <summary>
        /// Gets an assigned single-use promo code for the current customer, assigning one when needed.
        /// </summary>
        /// <param name="campaignId">Campaign Id.</param>
        /// <returns>Assigned Promo Code.</returns>
        public async Task<string> GetSingleUsePromoCode(string campaignId)
        {
            try
            {
                var customerMappedId = await _authenticationService.MappedCustomerId(); 
                
                var customerCode =
                    await _singleUseVoucherService.GetCustomerSingleUserPromoCode(customerMappedId, campaignId);
                if (string.IsNullOrEmpty(customerCode))
                {
                    customerCode =
                        await _singleUseVoucherService.AssignSingleUsePromoCodeToCustomer(customerMappedId, campaignId);
                    return customerCode;
                }

                var voucher = await _vouchersRepository.Get(customerCode);
                return voucher.Redemption.RedeemedQuantity > 0 ? string.Empty : customerCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get single use promo code");
                return string.Empty;
            }
            
        }

        /// <summary>
        /// Rollback single redemption.
        /// </summary>
        /// <param name="redemptionID">Redemption ID</param>
        /// <param name="reason">Reason to redeem</param>
        /// <param name="customerID">Customer ID</param>
        /// <returns></returns>
        private async Task<VoucherOperationResult> RollBackRedemption(string redemptionID, string reason,
            string customerID)
        {
            try
            {
                var rollBackResult = await _vouchersRepository.RollbackRedemption(redemptionID, reason, customerID);
                // Return succeed response if redeem was processed.
                return new VoucherOperationResult()
                {
                    CustomerID = customerID,
                    Code = redemptionID,
                    IsSuccess = true,
                    Response = rollBackResult,
                };
            }
            catch (Exception e)
            {
                // Return failed response if redemption failed.
                _logger.LogError(e, "Failed to roll back redemption: {Redemption}, {Reason}, {Customer}", redemptionID, reason, customerID);
                return new VoucherOperationResult()
                {
                    CustomerID = customerID,
                    Code = redemptionID,
                    IsSuccess = false,
                    Response = e,
                };
            }
        }

        private async Task<List<CreditSpend>> SpendCredit(decimal amount, Currency currency, string bookingReference, string accomCode, string customerId, RedemptionMetadata redemptionMetadata, List<CreditItem> currencyCredits)
        {
            var fullAmount = amount;
            try
            {
                await _awsUserCreditsService.ClearUserCreditsInfo(customerId);
            }
            catch (Exception e)
            {
                // Don't need throw error if failed to clear cache
                _logger.LogError(e, "Failed to clear cache");
            }

            // Build metadata
            var metadata = await BuildMetadata(bookingReference, accomCode, currency, redemptionMetadata);

            var results = new List<VoucherOperationResult>();
            for (var i = 0; i < currencyCredits.Count; i++)
            {
                // Check if can process redemption.
                if (!this.CanRedeemResults(currencyCredits.Skip(i), fullAmount))
                {
                    // Rollback succeed redemptions.
                    await RollBackCreditRedemptions(
                        results.Where(x => x.IsSuccess)
                            .Select(x => ((Redemption)x.Response).Id),
                        "Failed to redeem full amount");
                    _logger.LogError(new VoucherRedeemExeption(ApiExceptionCodes.CreditsInsufficientFunds),
                        "Insufficient funds");
                    throw new VoucherRedeemExeption(ApiExceptionCodes.CreditsInsufficientFunds);
                }

                CreditItem item = currencyCredits[i];
                // Redeem voucher
                var result = await SpendCredit(fullAmount, item, customerId, metadata);
                results.Add(result);
                if (result.IsSuccess)
                {
                    // Decrease amount on redemption amount
                    fullAmount -= ConvertVoucherAmountToDecimal(((Redemption)result.Response).Amount);
                }
                if (fullAmount <= 0)
                {
                    // Check if full amount was paid
                    break;
                }
            }

            if (fullAmount <= 0)
            {
                // Return redemption ids if everything went good.
                var successfulResultsByType = results.Where(x => x.IsSuccess).Select(item =>
                {
                    return new CreditSpend
                    {
                        ReasonCode = item.ReasonCode,
                        Amount = item.Amount,
                        RedemptionIds = ((Redemption)item.Response).Id,
                        VouchersIds = ((Redemption)item.Response).Voucher?.Code
                    };
                }).ToList();

                return successfulResultsByType;
            }

            //Roll back succeed redemptions if not full amount was processed
            await RollBackCreditRedemptions(
                results.Where(x => x.IsSuccess).Select(x => ((Redemption)x.Response).Id),
                "Failed to redeem full amount");
            _logger.LogError(new VoucherRedeemExeption(ApiExceptionCodes.CreditsFailedToWithdrawFullAmmount),
                "Failed to Withdraw full amount");
            throw new VoucherRedeemExeption(ApiExceptionCodes.CreditsFailedToWithdrawFullAmmount);
        }

        /// <summary>
        /// Redeem single voucher.
        /// </summary>
        /// <param name="amount">Amount to redeem</param>
        /// <param name="item">Voucher to redeem</param>
        /// <param name="customerId">customer ID</param>
        /// <param name="metadata"></param>
        /// <returns></returns>
        private async Task<VoucherOperationResult> SpendCredit(decimal amount, CreditItem item, string customerId,
            Dictionary<string, object> metadata = null)
        {
            // Get credit payment type
            var reasonCode = item.Metadata.FirstOrDefault(x => x.Key == VoucherifyMetaKeys.Reason)?.Value?.ToString();

            try
            {
                // Validate redemption before process.
                var validation = await _vouchersRepository.ValidateRedemption(item.Id,
                    GetRedemptionAmmount(amount, item.Balance), customerId, metadata);
                if (validation.Valid)
                {
                    var redemption = await _vouchersRepository.ProcessRedemption(item.Id,
                        GetRedemptionAmmount(amount, item.Balance), customerId, metadata);
                    // Return success response if redemption was succeed.
                    return BuildVoucherOperationResultObject(customerId, redemption.Id, reasonCode, true, redemption);
                }

                // Return failed response if validation fails.
                _logger.LogError("Voucher validation failed");
                return BuildVoucherOperationResultObject(customerId, validation.Code, reasonCode, false, validation);
            }
            catch (Exception e)
            {
                // Return failed response if validation or redemption went wrong.
                _logger.LogError(e, "Failed to redeem customer credits");
                return BuildVoucherOperationResultObject(customerId, item.Id, reasonCode, ex: e);
            }
        }

        /// <summary>
        /// Return operation result
        /// </summary>
        /// <param name="customerId">customer ID</param>
        /// <param name="code">Voucher/redeem/validation code</param>
        /// <param name="reasonCode">see <see cref="VoucherSettings.Types"/> and <see cref="VoucherSettings.PromoVouchers"/></param>
        /// <param name="isSuccess">operation result</param>
        /// <param name="response">operation response</param>
        /// <param name="ex">operation exception</param>
        private VoucherOperationResult BuildVoucherOperationResultObject(string customerId, string code,
            string reasonCode, bool isSuccess = false, object response = null, Exception ex = null)
        {
            var amount = ConvertVoucherAmountToDecimal((response as Redemption)?.Amount);
            return new VoucherOperationResult()
            {
                CustomerID = customerId,
                Code = code,
                IsSuccess = isSuccess,
                Response = response,
                InnerException = ex,
                ReasonCode = reasonCode,
                Amount = amount
            };
        }

        /// <summary>
        /// Check if customer can redeem full amount.
        /// </summary>
        /// <param name="myCredits">Available customer credits</param>
        /// <param name="fullAmount">Amount to redeem</param>
        private bool CanRedeemResults(IEnumerable<CreditItem> myCredits, decimal fullAmount)
        {
            return myCredits.Sum(x => x.Balance) >= fullAmount;
        }

        /// <summary>
        /// Compare redemption amount an full voucher amount return lowest one.
        /// </summary>
        /// <param name="initialAmount">initial amount</param>
        /// <param name="voucherAmount">voucher amount</param>
        /// <returns></returns>
        private decimal GetRedemptionAmmount(decimal initialAmount, decimal voucherAmount)
        {
            return voucherAmount >= initialAmount ? initialAmount : voucherAmount;
        }

        /// <summary>
        /// Convert voucher amount to decimal. 
        /// 2000 - Voucher amount = 20.00$
        /// </summary>
        /// <param name="amount">Amount to convert</param>
        private decimal ConvertVoucherAmountToDecimal(long? amount)
        {
            return (decimal)(amount ?? 0) / 100;
        }

        /// <summary>
        /// Build redemption metadata
        /// </summary>
        /// <param name="bookRef">booking reference</param>
        /// <param name="accomCode">Hotel code</param>
        /// <param name="currency">to be included in the metadata using the key <see cref="VoucherifyMetaKeys.Currency"/></param>
        /// <param name="redemptionMetadata">Redemption metadata (action, source, etc.)</param>
        /// <returns>Metadata dictionary</returns>
        private async Task<Dictionary<string, object>> BuildMetadata(string bookRef, string accomCode, Currency currency, RedemptionMetadata redemptionMetadata = null)
        {
            var meta = new Dictionary<string, object>();

            if (!string.IsNullOrEmpty(accomCode))
            {
                // Get hotel information to store info in credits history
                var hotelInfo = (await _hotelsService.GetHotelsByCodes(new[] { accomCode })).FirstOrDefault();

                meta = new Dictionary<string, object>()
                {
                    {VoucherifyMetaKeys.Hotel.Name, hotelInfo?.Name},
                    {VoucherifyMetaKeys.Hotel.Code, hotelInfo?.Code},
                    {VoucherifyMetaKeys.Hotel.LocationCode, hotelInfo?.Location?.Code},
                    {VoucherifyMetaKeys.Hotel.LocationName, hotelInfo?.Location?.Name},
                    {VoucherifyMetaKeys.Hotel.ResortCode, hotelInfo?.Resort?.Code},
                    {VoucherifyMetaKeys.Hotel.ResortName, hotelInfo?.Resort?.Name},
                    {VoucherifyMetaKeys.Hotel.CountryCode, hotelInfo?.Country?.Code},
                    {VoucherifyMetaKeys.Hotel.CountryName, hotelInfo?.Country?.Name},
                    {VoucherifyMetaKeys.Source, string.IsNullOrEmpty(redemptionMetadata?.Source) ? _voucherSettings.Source.Web : redemptionMetadata.Source},
                    {VoucherifyMetaKeys.Action, string.IsNullOrEmpty(redemptionMetadata?.Action) ? _voucherSettings.Action.CreditAndRefund : redemptionMetadata.Action},
                    {VoucherifyMetaKeys.Currency, currency.Code}
                };
            }

            meta.Add(VoucherifyMetaKeys.BookingRef, bookRef);

            return meta;
        }

        private async Task<decimal?> GetUserCreditBalance(Currency currency, string customerId = null)
        {
            if (currency == null)
            {
                _logger.LogWarning("GetUserCreditBalance. Currency must be specified to get balance for. Returning zero");
                return decimal.Zero;
            }
            var userCredits = await MyCreditItems(customerId);

            return userCredits.GetValueOrDefault(currency)?.Where(item => item.Expires == null || item.Expires >= DateTime.UtcNow).Sum(item => item.Balance) ?? decimal.Zero;
        }
    }


}
