namespace easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

/// <summary>
/// Booking cancellation summary
/// </summary>
public class CancellationSummaryResponse
{
    /// <summary>
    /// List of possible refunds
    /// </summary>
    public IList<CancellationSummaryRefundDetail> Refunds { get; init; }

    /// <summary>
    /// Refund currency
    /// </summary>
    public string Currency { get; init; }

    /// <summary>
    /// The hash to validate the cancellation
    /// </summary>
    public int RefundBreakdownValidationHash { get; init; }
    
    /// <summary>
    /// How much total was paid by using OTUC
    /// </summary>
    public decimal OneTimeUseCreditTotalPaid { get; init; }
    
    /// <summary>
    /// Days before departure
    /// </summary>
    public int DaysBeforeDeparture { get; init; }
    
    /// <summary>
    /// Is destination rules applied
    /// </summary>
    public bool IsDestinationRulesApplied { get; init; } 
    
    /// <summary>
    /// The amendment fee amount. This value comes from Atcom
    /// </summary>
    public decimal AmendmentFeeAmount { get; init; }

    /// <summary>
    /// Cancellation fee
    /// </summary>
    public decimal CancellationFee { get; init; }

    /// <summary>
    /// Credit expiry state for bookings with linked credit
    /// </summary>
    public BookingCreditExpiryState CreditExpiryState { get; set; }
}

/// <summary>
/// Booking cancellation summary for Trade
/// </summary>
public sealed class CancellationSummaryTradeResponse: CancellationSummaryResponse
{
    /// <summary>
    /// The original booking value
    /// </summary>
    public decimal OriginalBookingValue { get; init; }
}

/// <summary>
/// Common refund information 
/// </summary>
public abstract class CancellationSummaryRefundDetail
{
    /// <summary>
    /// Refund type
    /// </summary>
    public BookingCancellationRequestRefundOption RefundOption { get; init; }
    /// <summary>
    /// One time use credit amount
    /// </summary>
    public decimal OneTimeUseCredit { get; init; }
    /// <summary>
    /// Total amount
    /// </summary>
    public decimal Total { get; init; }
}

/// <summary>
/// Credit refund information
/// </summary>
public class CancellationSummaryCreditRefundDetail : CancellationSummaryRefundDetail
{
    /// <summary>
    /// Set default value
    /// </summary>
    public CancellationSummaryCreditRefundDetail() => RefundOption = BookingCancellationRequestRefundOption.Credit;
    /// <summary>
    /// easyJet holidays credit amount
    /// </summary>
    public decimal Credit { get; init; }
}

/// <summary>
/// Original payment method refund information
/// </summary>
public class CancellationSummaryOriginalRefundDetail : CancellationSummaryRefundDetail
{
    /// <summary>
    /// Set default value
    /// </summary>
    public CancellationSummaryOriginalRefundDetail() => RefundOption = BookingCancellationRequestRefundOption.OriginalPayment;
    /// <summary>
    /// Refunded amount to original payment method
    /// </summary>
    public decimal OriginalPayment { get; init; }
    /// <summary>
    /// easyJet holidays credit amount
    /// </summary>
    public decimal Credit { get; init; }
}
