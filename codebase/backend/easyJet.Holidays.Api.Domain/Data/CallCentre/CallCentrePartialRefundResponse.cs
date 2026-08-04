#nullable enable

using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.CallCentre;

/// <summary>
/// Response for partial refund
/// </summary>
[DataContract]
public record CallCentrePartialRefundResponse
{
    /// <summary>
    /// Voucher Id
    /// </summary>
    [DataMember(Name = "voucherId")]
    public string VoucherId { get; init; }

    /// <summary>
    /// Refund reason
    /// </summary>
    [DataMember(Name = "reason")]
    public string Reason { get; init; }
}
