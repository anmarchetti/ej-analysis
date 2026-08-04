using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
/// <summary>
/// This class will be used to show on the cancelled booking page the refunded amounts of the cancelled booking
/// </summary>
[Serializable]
[DataContract]
public class CancelledBookingRefundSummary
{
    /// <summary>
    /// How much cash was refunded
    /// </summary>
    [DataMember(Name = "cashRefundAmount")]
    public decimal CashRefundAmount { get; set; }

    /// <summary>
    /// How much credit was refunded
    /// </summary>
    [DataMember(Name = "creditRefundAmount")]
    public decimal CreditRefundAmount { get; set; }

    /// <summary>
    /// How much was refunded in total
    /// </summary>
    [DataMember(Name = "totalRefundAmount")]
    public decimal TotalRefundAmount { get; set; }

    /// <summary>
    /// The currency of the refunded amounts
    /// </summary>
    [DataMember(Name = "currency")]
    public string Currency { get; set; }
}
