using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using System.Collections.ObjectModel;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Data.Booking.Cancellation
{
    
    /// <summary>
    /// Includes all values for the credit refund breakdown.
    ///
    /// Exclude from coverage because it is tested in the CalculateCreditRefund_WhenPaidByPromoGiftCardAndGoodWillCreditAndItIsMoreThen60DaysBeforeDeparture_ShouldReturnResult test in the BookingCancellationCalculateCreditRefundServiceManualTests. Member data that is used is not process correctly during code coverage process.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class BookingCancellationCreditRefundBreakdown
    {
        /// <summary>
        /// Goodwill credit: usually it's deposit
        /// </summary>
        public decimal Goodwill { get; set; }
        
        /// <summary>
        /// Goodwill credit made of
        /// </summary>
        public ReadOnlyCollection<MadeOf> GoodwillCreditMadeOf { get; init; } = new(new List<MadeOf>());

        /// <summary>
        /// Regular credits
        /// </summary>
        public decimal Refund { get; set; }
        
        /// <summary>
        /// Refund credit made of
        /// </summary>
        public ReadOnlyCollection<MadeOf> RefundCreditMadeOf { get; init; } = new(new List<MadeOf>());

        /// <summary>
        /// Gift card credits amount. Part of this amount may be already part of goodwill
        /// </summary>
        public decimal GiftCard { get; set; }
        
        /// <summary>
        /// Gift card credit made of
        /// </summary>
        public ReadOnlyCollection<MadeOf> GiftCardCreditMadeOf { get; init; } = new(new List<MadeOf>());

        /// <summary>
        /// Promo credits sum
        /// </summary>
        public IReadOnlyCollection<BookingCancellationPromoRefundBreakdownItem> PromoBreakdownItems { get; set; } = new List<BookingCancellationPromoRefundBreakdownItem>();

        /// <summary>
        /// OneTimeUse credits sum
        /// </summary>
        public decimal OneTimeUse { get; set; }
        
        /// <summary>
        /// OneTimeUse structure
        /// </summary>
        public OneTimeUseCreditStructure OneTimeUseCreditStructure { get; set; } = new OneTimeUseCreditStructure();
        
        /// <summary>
        /// Total credits sum
        /// </summary>
        /// <returns></returns>
        public decimal Total() => OneTimeUse + Goodwill + Refund + GiftCard + PromoBreakdownItems.Sum(i => i.Amount);
    }
    
    /// <summary>
    /// made of structure
    /// </summary>
    public class MadeOf
    {
        /// <summary>
        /// Made of
        /// </summary>
        public string MadeOfCode { get; init; }
        
        /// <summary>
        /// Amount
        /// </summary>
        public decimal Amount { get; init; }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="madeOfCode"></param>
        /// <param name="amount"></param>
        public MadeOf(string madeOfCode, decimal amount)
        {
            MadeOfCode = madeOfCode;
            Amount = amount;
        }
    }
    
    /// <summary>
    /// made of structure
    /// </summary>
    public class MadeOfWithReason
    {
        /// <summary>
        /// Made of
        /// </summary>
        public string MadeOfCode { get; init; }
        
        /// <summary>
        /// Reason
        /// </summary>
        public string Reason { get; init; }
        
        /// <summary>
        /// Amount
        /// </summary>
        public decimal Amount { get; init; }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="madeOfCode"></param>
        /// <param name="amount"></param>
        /// <param name="reason"></param>
        public MadeOfWithReason(string madeOfCode, decimal amount, string reason)
        {
            MadeOfCode = madeOfCode;
            Amount = amount;
            Reason = reason;
        }
    }

    /// <summary>
    /// 
    /// </summary>
    public class BookingCancellationPromoRefundBreakdownItems
    {
        /// <summary>
        /// Promo credits sum
        /// </summary>
        public IReadOnlyCollection<BookingCancellationPromoRefundBreakdownItem> PromoBreakdownItems { get; set; } = new List<BookingCancellationPromoRefundBreakdownItem>();
        /// <summary>
        /// OneTimeUse credits made of credit types
        /// </summary>
        public IReadOnlyList<MadeOfWithReason> OneTimeUseCreditMadeOf { get; set; } = new List<MadeOfWithReason>();
    }
    /// <summary>
    /// 
    /// </summary>
    public class BookingCancellationPromoRefundBreakdownItem
    {
        /// <summary>
        /// Amount of the promo refund item
        /// </summary>
        public decimal Amount { get; set; }

        /// <summary>
        /// Expiration Date of the promo refund item
        /// </summary>
        public DateTimeOffset? ExpirationDate { get; set; }

        /// <summary>
        /// Promotion ID of the promo refund item
        /// </summary>
        public int PromoId { get; set; }

        /// <summary>
        /// Reason of the promo refund item
        /// </summary>
        public string Reason { get; set; }
        
        /// <summary>
        /// Made of
        /// </summary>
        public IReadOnlyList<MadeOfWithReason> MadeOf { get; set; }
    }
}
