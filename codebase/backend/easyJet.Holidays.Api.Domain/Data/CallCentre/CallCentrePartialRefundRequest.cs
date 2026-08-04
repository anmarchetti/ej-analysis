#nullable enable

using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.CallCentre;

[DataContract]
public record CallCentrePartialRefundRequest
{
    [DataMember(Name = "bookingRef")]
    public string BookingReference { get; init; }

    [DataMember(Name = "date")]
    public DateOnly BookingDate { get; init; }

    [DataMember(Name = "lastName")]
    public string LeadPaxLastName { get; init; }

    [DataMember(Name = "paymentId")]
    public string PaymentId { get; init; }

    [DataMember(Name = "amount")]
    public decimal RefundAmount { get; init; }

    [DataMember(Name = "agentId")]
    public string CallCentreAgentId { get; init; }
}
