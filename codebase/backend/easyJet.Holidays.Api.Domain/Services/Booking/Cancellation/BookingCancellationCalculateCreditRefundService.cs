#nullable enable

using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using System.Collections.ObjectModel;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation
{
    /// <inheritdoc />
    public class BookingCancellationCalculateCreditRefundService : IBookingCancellationCalculateCreditRefundService
    {
        private readonly ILogger<BookingCancellationCalculateCreditRefundService> _logger;
        private readonly IApiSettingsService _apiSettingsService;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="apiSettingsService"></param>
        /// <param name="logger"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public BookingCancellationCalculateCreditRefundService(IApiSettingsService apiSettingsService,
            ILogger<BookingCancellationCalculateCreditRefundService> logger)
        {
            _apiSettingsService = apiSettingsService;
            _logger = logger;
        }

        /// <inheritdoc />
        public Task<BookingCancellationCreditRefundBreakdown> CalculateCreditRefund(BookingResponse bookingResponse,
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown,
            BookingCancellationRequestRefundOption refundOptionType, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(bookingCancellationRefundBreakdown);
            ArgumentNullException.ThrowIfNull(bookingResponse);

            if (bookingCancellationRefundBreakdown.TotalRefundAmount <= 0)
            {
                _logger.LogDebug(
                    $"{nameof(bookingCancellationRefundBreakdown.TotalRefundAmount)} is 0. There is nothing to refund");
                return Task.FromResult(new BookingCancellationCreditRefundBreakdown() { });
            }

            var transferredRefundCreditAmount =
                GetTransferredRefundCreditAmount(bookingCancellationRefundBreakdown, refundOptionType);
            if (bookingCancellationRefundBreakdown.CreditRefundAmount <= 0 && transferredRefundCreditAmount <= 0)
            {
                _logger.LogDebug(
                    $"{nameof(bookingCancellationRefundBreakdown.CreditRefundAmount)} or {nameof(transferredRefundCreditAmount)} is smaller or equals 0");
                return Task.FromResult(new BookingCancellationCreditRefundBreakdown() { });
            }

            var oneTimeUseCreditRefundAmount = bookingCancellationRefundBreakdown.OneTimeUseCreditRefundAmount;
            var creditAmountToRefund = CalculateCreditAmountToRefund(bookingResponse,
                bookingCancellationRefundBreakdown.TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount,
                transferredRefundCreditAmount, bookingCancellationRefundBreakdown.DaysBeforeDeparture, 
                bookingCancellationRefundBreakdown.OriginalCancelFeeAmount, 
                bookingCancellationRefundBreakdown.OneTimeUseCreditKeptAmount, 
                bookingCancellationRefundBreakdown.OneTimeUseCreditRefundAmount);

            var calculatedGoodWillCreditRefundAmount = creditAmountToRefund.GoodwillCreditAmount;
            var calculatedGiftCardCreditRefundAmount = creditAmountToRefund.GiftCardCreditAmount;
            var calculatedRefundCreditRefundAmount = creditAmountToRefund.RefundCreditAmount;
            var calculatedPromoCreditRefundAmount = creditAmountToRefund.PromoCreditAmount;

            var bookingCancellationPromoRefundBreakdownItems =
                GetPromoRefundBreakdownItems(bookingResponse, calculatedPromoCreditRefundAmount, 
                    creditAmountToRefund.RemainingPromoCreditMadeOfTransNo);
            BookingCancellationCreditRefundBreakdown creditRefundBreakdown = new()
            {
                Goodwill = calculatedGoodWillCreditRefundAmount,
                GoodwillCreditMadeOf = new ReadOnlyCollection<MadeOf>(creditAmountToRefund.GoodwillCreditMadeOfTransNo),
                GiftCard = calculatedGiftCardCreditRefundAmount,
                GiftCardCreditMadeOf = new ReadOnlyCollection<MadeOf>(creditAmountToRefund.GiftCardCreditMadeOfTransNo),
                Refund = calculatedRefundCreditRefundAmount,
                RefundCreditMadeOf = new ReadOnlyCollection<MadeOf>(creditAmountToRefund.RefundCreditMadeOfTransNo),
                OneTimeUse = oneTimeUseCreditRefundAmount,
                PromoBreakdownItems = bookingCancellationPromoRefundBreakdownItems.PromoBreakdownItems,
                OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
                {
                    GoodwillCreditMadeOf = new ReadOnlyCollection<MadeOf>(creditAmountToRefund.RemainingGoodwillCreditMadeOfTransNo),
                    PromoCreditMadeOf =
                        new ReadOnlyCollection<MadeOfWithReason>(bookingCancellationPromoRefundBreakdownItems
                            .OneTimeUseCreditMadeOf.ToList()),
                    RefundCreditMadeOf = new ReadOnlyCollection<MadeOf>(creditAmountToRefund.RemainingRefundCreditMadeOfTransNo),
                    GiftCardCreditMadeOf = new ReadOnlyCollection<MadeOf>(creditAmountToRefund.RemainingGiftCardCreditMadeOfTransNo),
                    OneTimeUseCreditMadeOf = new ReadOnlyCollection<MadeOf>(creditAmountToRefund.RemainingOneTimeUseCreditMadeOfTransNo),
                }
            };

            return Task.FromResult(creditRefundBreakdown);
        }

        private static decimal GetTransferredRefundCreditAmount(
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown,
            BookingCancellationRequestRefundOption refundOptionType)
        {
            var transferredRefundCredit = bookingCancellationRefundBreakdown.TransferredCashPaymentToRefundCreditAmount;
            if (refundOptionType != BookingCancellationRequestRefundOption.Credit)
                return transferredRefundCredit;

            //case if the user wants to refund everything in credit but paid also with cash
            return transferredRefundCredit + bookingCancellationRefundBreakdown.CashRefundAmount;
        }

        private static CreditAmountToRefund CalculateCreditAmountToRefund(BookingResponse bookingResponse,
            decimal totalRefundCreditAmountExceptOneTimeUseCreditRefundAmount, decimal transferredRefundCreditAmount,
            int daysBeforeDeparture, decimal originalCancelFeeAmount, decimal oneTimeUseCreditKeptAmount, decimal oneTimeUseCreditRefundAmount)
        {
            decimal creditToKept = GetCreditToKept(bookingResponse, totalRefundCreditAmountExceptOneTimeUseCreditRefundAmount, oneTimeUseCreditKeptAmount, oneTimeUseCreditRefundAmount);
            
            var amountToRefund = totalRefundCreditAmountExceptOneTimeUseCreditRefundAmount;

            var promoPayments = bookingResponse.PaymentInfo?.PaymentHistory?
                .Where(paymentHistoryItem => paymentHistoryItem.IsPromoCredit).ToList() ?? new List<PaymentHistoryItem>();
            var promoRefund = Refund(promoPayments, ref amountToRefund, ref creditToKept);
            
            var giftCardPayments = bookingResponse.PaymentInfo?.PaymentHistory?
                .Where(paymentHistoryItem => paymentHistoryItem.IsGiftCardCredit).ToList() ?? new List<PaymentHistoryItem>();
            var giftCardRefund = Refund(giftCardPayments, ref amountToRefund, ref creditToKept);
            
            var otherRefundPayments = bookingResponse.PaymentInfo?.PaymentHistory?
                .Where(paymentHistoryItem => paymentHistoryItem.IsCredit && paymentHistoryItem is { IsGoodWill: false, IsPromoCredit: false, IsGiftCardCredit: false, IsOneTimeUseCredit: false }).ToList() ?? new List<PaymentHistoryItem>();
            var otherRefund = Refund(otherRefundPayments, ref amountToRefund, ref creditToKept);
            
            var goodwillPayments = bookingResponse.PaymentInfo?.PaymentHistory?
                .Where(paymentHistoryItem => paymentHistoryItem.IsGoodWill).ToList() ?? new List<PaymentHistoryItem>();
            var goodwillRefund = Refund(goodwillPayments, ref amountToRefund, ref creditToKept);

            var alreadyDistributedOneTimeUseCreditAmount = GetAlreadyDistributedOneTimeUseCreditAmount(promoRefund, giftCardRefund, otherRefund, goodwillRefund);
            List<MadeOf> remainingOneTimeUseCreditMadeOfTransNo = GetRemainingOneTimeUseCreditMadeOfTransNo(bookingResponse, daysBeforeDeparture, originalCancelFeeAmount, oneTimeUseCreditKeptAmount, alreadyDistributedOneTimeUseCreditAmount);

            return new CreditAmountToRefund
            {
                GoodwillCreditAmount = goodwillRefund.Refunded,
                GoodwillCreditMadeOfTransNo = goodwillRefund.CreditMadeOfTransNo,
                RemainingGoodwillCreditMadeOfTransNo = goodwillRefund.OneTimeUseCreditMadeOfTransNo,
                GiftCardCreditAmount = giftCardRefund.Refunded, 
                GiftCardCreditMadeOfTransNo = giftCardRefund.CreditMadeOfTransNo,
                RemainingGiftCardCreditMadeOfTransNo = giftCardRefund.OneTimeUseCreditMadeOfTransNo,
                PromoCreditAmount = promoRefund.Refunded,
                PromoCreditMadeOfTransNo = promoRefund.CreditMadeOfTransNo,
                RemainingPromoCreditMadeOfTransNo = promoRefund.OneTimeUseCreditMadeOfTransNo,
                RefundCreditAmount = otherRefund.Refunded + transferredRefundCreditAmount,
                RefundCreditMadeOfTransNo = otherRefund.CreditMadeOfTransNo,
                RemainingRefundCreditMadeOfTransNo = otherRefund.OneTimeUseCreditMadeOfTransNo,
                RemainingOneTimeUseCreditMadeOfTransNo = remainingOneTimeUseCreditMadeOfTransNo,
            };
        }

        private static decimal GetAlreadyDistributedOneTimeUseCreditAmount((List<MadeOf> CreditMadeOfTransNo, List<MadeOf> OneTimeUseCreditMadeOfTransNo, decimal Refunded) promoRefund, (List<MadeOf> CreditMadeOfTransNo, List<MadeOf> OneTimeUseCreditMadeOfTransNo, decimal Refunded) giftCardRefund, (List<MadeOf> CreditMadeOfTransNo, List<MadeOf> OneTimeUseCreditMadeOfTransNo, decimal Refunded) otherRefund, (List<MadeOf> CreditMadeOfTransNo, List<MadeOf> OneTimeUseCreditMadeOfTransNo, decimal Refunded) goodwillRefund)
        {
            var promoOneTimeUseCreditRefund = promoRefund.OneTimeUseCreditMadeOfTransNo.Sum(i => i.Amount);
            var giftCardRefundOneTimeUseCreditRefund = giftCardRefund.OneTimeUseCreditMadeOfTransNo.Sum(i => i.Amount);
            var otherRefundOneTimeUseCreditRefund = otherRefund.OneTimeUseCreditMadeOfTransNo.Sum(i => i.Amount);
            var goodwillRefundOneTimeUseCreditRefund = goodwillRefund.OneTimeUseCreditMadeOfTransNo.Sum(i => i.Amount);

            return promoOneTimeUseCreditRefund + giftCardRefundOneTimeUseCreditRefund +
                   otherRefundOneTimeUseCreditRefund + goodwillRefundOneTimeUseCreditRefund;
        }

        internal static decimal GetCreditToKept(BookingResponse bookingResponse,
            decimal totalRefundCreditAmountExceptOneTimeUseCreditRefundAmount, decimal oneTimeUseCreditKeptAmount,
            decimal oneTimeUseCreditRefundAmount)
        {
            decimal creditToKept = Math.Max((bookingResponse.PaymentInfo?.PaymentHistory?
                .Where(paymentHistoryItem => paymentHistoryItem.IsCredit).Sum(x => x.Amount)??0) - oneTimeUseCreditKeptAmount - totalRefundCreditAmountExceptOneTimeUseCreditRefundAmount - oneTimeUseCreditRefundAmount, 0);
            return creditToKept;
        }

        internal static List<MadeOf> GetRemainingOneTimeUseCreditMadeOfTransNo(BookingResponse bookingResponse,
            int daysBeforeDeparture,
            decimal originalCancelFeeAmount, decimal oneTimeUseCreditKeptAmount,
            decimal alreadyDistributedOneTimeUseCreditAmount)
        {
            var oneTimeUsePayments = bookingResponse.PaymentInfo?.PaymentHistory?
                .Where(paymentHistoryItem => paymentHistoryItem.IsOneTimeUseCredit && paymentHistoryItem.Amount > 0) ?? new List<PaymentHistoryItem>();

            var feeToRetain = (daysBeforeDeparture > 60 ? originalCancelFeeAmount : oneTimeUseCreditKeptAmount);
            List<MadeOf> remainingOneTimeUseCreditMadeOfTransNo = new List<MadeOf>();
            foreach (var oneTimeUsePayment in oneTimeUsePayments)
            {
                if (oneTimeUsePayment.Amount > (feeToRetain + alreadyDistributedOneTimeUseCreditAmount))
                {
                    remainingOneTimeUseCreditMadeOfTransNo.Add(new MadeOf(oneTimeUsePayment.TransNo, oneTimeUsePayment.Amount - feeToRetain - alreadyDistributedOneTimeUseCreditAmount)); 
                }
                feeToRetain -= oneTimeUsePayment.Amount;
                if (feeToRetain < 0)
                {
                    feeToRetain = 0;
                }
            }

            return remainingOneTimeUseCreditMadeOfTransNo;
        }

        private static (List<MadeOf> CreditMadeOfTransNo, List<MadeOf> OneTimeUseCreditMadeOfTransNo, decimal Refunded) 
            Refund(List<PaymentHistoryItem> paymentItems, ref decimal amountToRefund, ref decimal creditToKept)
        {
            List<MadeOf> madeOfTransNo = new();
            List<MadeOf> oneTimeUseMadeOfTransNo = new();
            decimal refunded = 0;
            var normalizedPaymentItems = NormalizePaymentItems(paymentItems);
            foreach (var paymentHistoryItem in normalizedPaymentItems)
            {
                decimal toRefund = Math.Min(amountToRefund, Math.Max(paymentHistoryItem.Amount, 0));
                if (toRefund > 0 && paymentHistoryItem.Amount > 0)
                {
                    madeOfTransNo.Add(new MadeOf(paymentHistoryItem.TransNo, toRefund));
                }

                amountToRefund -= toRefund;
                refunded += toRefund;
                if ((toRefund < paymentHistoryItem.Amount) && paymentHistoryItem.Amount > 0)
                {
                    var oneTimeUseAmount = Math.Max(paymentHistoryItem.Amount - toRefund - creditToKept, 0);
                    creditToKept -= Math.Max(paymentHistoryItem.Amount - toRefund, 0);
                    if(creditToKept < 0)
                    {
                        creditToKept = 0;
                    }
                    if (oneTimeUseAmount > 0)
                    {
                        oneTimeUseMadeOfTransNo.Add(new MadeOf(paymentHistoryItem.TransNo, oneTimeUseAmount));
                    }
                }
            }
            return (madeOfTransNo, oneTimeUseMadeOfTransNo, refunded);
        }

        private static List<PaymentHistoryItem> NormalizePaymentItems(List<PaymentHistoryItem> payments)
        {
            if (!HasNegativePaymentInList(payments))
                return payments;

            var amountOfValues = Math.Max(payments.Sum(i => i.Amount), 0);
            var newPaymentList = new List<PaymentHistoryItem>();
            foreach (var paymentHistoryItem in payments)
            {
                if(amountOfValues <= 0)
                    break;

                var voucherAmount = Math.Max(paymentHistoryItem.Amount, 0);
                if (amountOfValues < voucherAmount)
                {
                    var changedPaymentHistoryItem = CreateNormalizedPaymentHistoryItem(amountOfValues, paymentHistoryItem);
                    newPaymentList.Add(changedPaymentHistoryItem);
                    amountOfValues -= changedPaymentHistoryItem.Amount;
                    continue;
                }

                newPaymentList.Add(paymentHistoryItem);
                amountOfValues -= paymentHistoryItem.Amount;
            }

            return newPaymentList;
        }

        private static PaymentHistoryItem CreateNormalizedPaymentHistoryItem(decimal amountOfValues, PaymentHistoryItem paymentHistoryItem)
        {
            var changedPaymentHistoryItem = new PaymentHistoryItem()
            {
                Amount = amountOfValues,
                TransNo = paymentHistoryItem.TransNo,
                AuthCode = paymentHistoryItem.AuthCode,
                AuthSys = paymentHistoryItem.AuthSys,
                Card = paymentHistoryItem.Card,
                CurIso = paymentHistoryItem.CurIso,
                IsCredit = paymentHistoryItem.IsCredit,
                IsGiftCardCredit = paymentHistoryItem.IsGiftCardCredit,
                IsGoodWill = paymentHistoryItem.IsGoodWill,
                IsOneTimeUseCredit = paymentHistoryItem.IsOneTimeUseCredit,
                IsPromoCredit = paymentHistoryItem.IsPromoCredit,
                PayDetails = paymentHistoryItem.PayDetails,
                PayDtTm = paymentHistoryItem.PayDtTm,
                PayId = paymentHistoryItem.PayId,
                PayMethodCode = paymentHistoryItem.PayMethodCode,
                PaymentDate = paymentHistoryItem.PaymentDate,
                RefundAgainstId = paymentHistoryItem.RefundAgainstId,
                RefundableAmount = paymentHistoryItem.RefundableAmount
            };
            return changedPaymentHistoryItem;
        }

        private static bool HasNegativePaymentInList(List<PaymentHistoryItem> payments)
        {
            return payments.Any(i => i.Amount < 0);
        }

        private BookingCancellationPromoRefundBreakdownItems GetPromoRefundBreakdownItems(
            BookingResponse bookingResponse, decimal calculatedPromoCreditRefundAmount, 
            List<MadeOf> remainingPromoCreditMadeOfTransNo)
        {
            var promoItemId = bookingResponse.PaymentInfo.PaymentHistory.Length;
            var promoPayItems = bookingResponse
                .PaymentInfo
                .PaymentHistory
                ?.Where(paymentItem => paymentItem.IsPromoCredit)
                .GroupBy(paymentItem =>
                {
                    var settings =
                        _apiSettingsService.GetPaymentCodesSettingsByPaymentCode(paymentItem.PayMethodCode);
                    return new { Reason = settings.Reason };
                })
                .Select(paymentReasonGroup =>
                {
                    var settings =
                        _apiSettingsService.GetPaymentCodesSettingsByReason(paymentReasonGroup.Key.Reason);
                    return new PromoPaymentInfo
                    {
                        Reason = paymentReasonGroup.Key.Reason,
                        Amount = paymentReasonGroup.Sum(x => x.Amount),
                        PromoId = promoItemId++,
                        PriorityNumber = settings.PriorityNumber,
                        ExpirationDate = settings.ExpirationDate,
                        MadeOf = paymentReasonGroup
                            .GroupBy(x => x.TransNo)
                            .Select(group => new MadeOfWithReason(
                                group.Key, 
                                group.Sum(x => x.Amount), 
                                paymentReasonGroup.Key.Reason))
                            .ToList()
                    };
                })
                .Where(promoReasonGroup => promoReasonGroup.Amount > 0)
                .OrderBy(paymentItem => paymentItem.PriorityNumber)
                .ToArray() ?? [];
            return BuildPromoRefundBreakdownItems(promoPayItems, calculatedPromoCreditRefundAmount, 
                remainingPromoCreditMadeOfTransNo);

        }

        private static BookingCancellationPromoRefundBreakdownItems BuildPromoRefundBreakdownItems(
            PromoPaymentInfo[] promoPayItems, decimal calculatedPromoCreditRefundAmount, 
            List<MadeOf> remainingPromoCreditMadeOfTransNo)
        {
            List<MadeOfWithReason> oneTimeUseCreditMadeOf = new();
            var bookingCancellationPromoRefundBreakdownItems = new List<BookingCancellationPromoRefundBreakdownItem>();
            foreach (var promoPaymentInfo in promoPayItems)
            {
                var promoCreditTotalRefundAmount = calculatedPromoCreditRefundAmount >= promoPaymentInfo.Amount
                    ? promoPaymentInfo.Amount
                    : calculatedPromoCreditRefundAmount;
                List<MadeOfWithReason> breakdownMadeOf = [];
                calculatedPromoCreditRefundAmount = CalculatedPromoCreditRefundAmount(calculatedPromoCreditRefundAmount, 
                    promoPaymentInfo, breakdownMadeOf, oneTimeUseCreditMadeOf, remainingPromoCreditMadeOfTransNo);

                if (breakdownMadeOf.Count != 0)
                {
                    var bookingCancellationPromoRefundBreakdownItem =
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = promoCreditTotalRefundAmount,
                            ExpirationDate = promoPaymentInfo.ExpirationDate,
                            PromoId = promoPaymentInfo.PromoId,
                            Reason = promoPaymentInfo.Reason,
                            MadeOf = breakdownMadeOf
                        };
                    bookingCancellationPromoRefundBreakdownItems.Add(bookingCancellationPromoRefundBreakdownItem);
                }
            }
            
            return new BookingCancellationPromoRefundBreakdownItems()
            {
                PromoBreakdownItems = bookingCancellationPromoRefundBreakdownItems,
                OneTimeUseCreditMadeOf = oneTimeUseCreditMadeOf
            };
        }

        private static decimal CalculatedPromoCreditRefundAmount(decimal calculatedPromoCreditRefundAmount,
            PromoPaymentInfo promoPaymentInfo, List<MadeOfWithReason> breakdownMadeOf, 
            List<MadeOfWithReason> oneTimeUseCreditMadeOf, List<MadeOf> remainingPromoCreditMadeOfTransNo)
        {
            foreach (var madeOf in promoPaymentInfo.MadeOf)
            {
                if (calculatedPromoCreditRefundAmount > 0)
                {
                    var promoCreditRefundAmount = calculatedPromoCreditRefundAmount >= madeOf.Amount
                        ? madeOf.Amount
                        : calculatedPromoCreditRefundAmount;

                    breakdownMadeOf.Add(new MadeOfWithReason(madeOf.MadeOfCode, promoCreditRefundAmount, madeOf.Reason));
                    calculatedPromoCreditRefundAmount -= promoCreditRefundAmount;
                }
                var groupedRemainingPromoCredit = remainingPromoCreditMadeOfTransNo
                    .GroupBy(x => x.MadeOfCode)
                    .Select(group => new MadeOf(
                        group.Key,
                        group.Sum(x => x.Amount)))
                    .ToList();
                var oneTimeUseMadeOfs = groupedRemainingPromoCredit.Where(x => x.MadeOfCode == madeOf.MadeOfCode);
                foreach (var oneTimeUseMadeOf in oneTimeUseMadeOfs)
                {
                    oneTimeUseCreditMadeOf.Add(new MadeOfWithReason(madeOf.MadeOfCode, oneTimeUseMadeOf.Amount, madeOf.Reason));
                }
            }

            return calculatedPromoCreditRefundAmount;
        }


        private sealed class CreditAmountToRefund
        {
            public decimal GoodwillCreditAmount { get; init; }

            public List<MadeOf> GoodwillCreditMadeOfTransNo { get; init; } = new();
            
            public List<MadeOf> RemainingGoodwillCreditMadeOfTransNo { get; init; } = new();

            public decimal PromoCreditAmount { get; init; }
            public List<MadeOf> PromoCreditMadeOfTransNo { get; init; } = new();
            public List<MadeOf> RemainingPromoCreditMadeOfTransNo { get; init; } = new();
            
            public decimal RefundCreditAmount { get; init; }
            
            public List<MadeOf> RefundCreditMadeOfTransNo { get; init; } = new();
            
            public List<MadeOf> RemainingRefundCreditMadeOfTransNo { get; init; } = new();

            public decimal GiftCardCreditAmount { get; init; }
            
            public List<MadeOf> GiftCardCreditMadeOfTransNo { get; init; } = new();
            
            public List<MadeOf> RemainingGiftCardCreditMadeOfTransNo { get; init; } = new();
            
            public List<MadeOf> RemainingOneTimeUseCreditMadeOfTransNo { get; init; } = new();
            
        }

        private sealed class PromoPaymentInfo
        {
            public required string Reason { get; init; }
            public decimal Amount { get; init; }
            public int PromoId { get; init; }
            public List<MadeOfWithReason> MadeOf { get; init; } = new();
            public int PriorityNumber { get; init; }
            public DateTimeOffset? ExpirationDate { get; init; }
        }
    }

    /// <summary>
    /// Structure for one time use credit
    /// </summary>
    public sealed class OneTimeUseCreditStructure
    {
        /// <summary>
        /// Goodwill credit made of
        /// </summary>
        public ReadOnlyCollection<MadeOf> GoodwillCreditMadeOf { get; init; } = new(new List<MadeOf>());

        /// <summary>
        /// Promo credit made of
        /// </summary>
        public ReadOnlyCollection<MadeOfWithReason> PromoCreditMadeOf { get; init; } = new(new List<MadeOfWithReason>());
        
        /// <summary>
        /// Refund credit made of
        /// </summary>
        public ReadOnlyCollection<MadeOf> RefundCreditMadeOf { get; init; } = new(new List<MadeOf>());
        
        /// <summary>
        /// GiftCard credit made of
        /// </summary>
        public ReadOnlyCollection<MadeOf> GiftCardCreditMadeOf { get; init; } = new(new List<MadeOf>());
        
        /// <summary>
        /// One time use credit made of
        /// </summary>
        public ReadOnlyCollection<MadeOf> OneTimeUseCreditMadeOf { get; init; } = new(new List<MadeOf>());
    }
}