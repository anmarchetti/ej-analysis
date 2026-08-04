namespace easyJet.Holidays.Api.Domain.Data.Booking.Cancellation
{
    /// <summary>
    /// 
    /// </summary>
    public class BookingCancellationRefundBreakdown
    {
        /// <summary>
        /// OneTimeUserCredit amount that will be kept because customer paid already with OneTimeCredit
        /// </summary>
        public decimal OneTimeUseCreditKeptAmount { get; init; }

        /// <summary>
        /// The cancellation fee amount. This value comes from Atcom
        /// </summary>
        public decimal CancelFeeAmount { get; init; }

        /// <summary>
        /// The amendment fee amount. This value comes from Atcom
        /// </summary>
        public decimal AmendmentFeeAmount { get; init; }

        /// <summary>
        /// OneTimeUserCredit amount that will be refunded
        /// </summary>
        public decimal OneTimeUseCreditRefundAmount { get; init; }

        /// <summary>
        /// Cash amount that will be refunded
        /// </summary>
        public decimal CashRefundAmount { get; init; }

        /// <summary>
        /// Credit amount that will be refunded
        /// </summary>
        public decimal CreditRefundAmount { get; init; }

        /// <summary>
        /// Credit others then one time use amount that will be refunded
        /// </summary>
        public decimal TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount { get; init; }

        /// <summary>
        /// Total amount that will be refunded to the customer
        /// </summary>
        public decimal TotalRefundAmount { get; init; }

        /// <summary>
        /// Total amount without the OneTimeUserCredit amount that will be refunded to the customer
        /// </summary>
        public decimal TotalRefundAmountExceptOneTimeUseCreditRefundAmount { get; init; }

        /// <summary>
        /// Cash amount that will be refunded as credit
        /// </summary>
        public decimal TransferredCashPaymentToRefundCreditAmount { get; init; }
        
        /// <summary>
        /// Booking currency
        /// </summary>
        public string Currency { get; init; }
        
        /// <summary>
        /// Days before departure
        /// </summary>
        public int DaysBeforeDeparture { get; init; }
        
        /// <summary>
        /// How much total was paid by using OTUC
        /// </summary>
        public decimal OneTimeUseCreditTotalPaidAmount { get; init; }
        
        /// <summary>
        /// The original booking value
        /// </summary>
        public required decimal OriginalBookingValue { get; init; }
        
        /// <summary>
        /// Is destination rules applied
        /// </summary>
        public bool IsDestinationRulesApplied { get; init; } 
        
        /// <summary>
        /// The original cancellation fee amount. This value comes from Atcom
        /// </summary>
        public decimal OriginalCancelFeeAmount { get; init; }
        
        /// <summary>
        /// Check if the object is equal to another object
        /// </summary>
        /// <param name="obj"></param>
        /// <returns></returns>
        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
            {
                return false;
            }

            var other = (BookingCancellationRefundBreakdown)obj;
            return this.OneTimeUseCreditRefundAmount == other.OneTimeUseCreditRefundAmount
                   && this.OneTimeUseCreditKeptAmount == other.OneTimeUseCreditKeptAmount
                   && this.CancelFeeAmount == other.CancelFeeAmount
                   && this.AmendmentFeeAmount == other.AmendmentFeeAmount
                   && this.TotalRefundAmount == other.TotalRefundAmount
                   && this.CashRefundAmount == other.CashRefundAmount
                   && this.CreditRefundAmount == other.CreditRefundAmount
                   && this.TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount == other.TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount
                   && this.TotalRefundAmountExceptOneTimeUseCreditRefundAmount == other.TotalRefundAmountExceptOneTimeUseCreditRefundAmount
                   && this.TransferredCashPaymentToRefundCreditAmount == other.TransferredCashPaymentToRefundCreditAmount
                   && this.Currency == other.Currency
                   && this.DaysBeforeDeparture == other.DaysBeforeDeparture
                   && this.OneTimeUseCreditTotalPaidAmount == other.OneTimeUseCreditTotalPaidAmount;
        }

        /// <summary>
        /// HashCode to identify if the object is in the cancel step the same as in the summary step
        /// </summary>
        /// <returns></returns>
        public override int GetHashCode()
        {
            unchecked
            {
                int hash = 17;
                hash = hash * 23 + OneTimeUseCreditKeptAmount.GetHashCode();
                hash = hash * 23 + CancelFeeAmount.GetHashCode();
                hash = hash * 23 + AmendmentFeeAmount.GetHashCode();
                hash = hash * 23 + OneTimeUseCreditRefundAmount.GetHashCode();
                hash = hash * 23 + TotalRefundAmount.GetHashCode();
                hash = hash * 23 + CashRefundAmount.GetHashCode();
                hash = hash * 23 + CreditRefundAmount.GetHashCode();
                hash = hash * 23 + TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount.GetHashCode();
                hash = hash * 23 + TotalRefundAmountExceptOneTimeUseCreditRefundAmount.GetHashCode();
                hash = hash * 23 + TransferredCashPaymentToRefundCreditAmount.GetHashCode();
                hash = hash * 23 + OneTimeUseCreditTotalPaidAmount.GetHashCode();
                return hash;
            }
        }
    }
}