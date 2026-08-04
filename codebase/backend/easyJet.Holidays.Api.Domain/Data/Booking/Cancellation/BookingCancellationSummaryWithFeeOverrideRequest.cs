#nullable enable
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

/// <summary>
/// Request object to cancel a booking with fee override 
/// </summary>
public class BookingCancellationSummaryWithFeeOverrideRequest : BookingCancellationSummaryRequest
{
    /// <summary>
    /// Fee value to override
    /// </summary>
    [DataMember(Name = "fee")]
    [Required]
    public decimal? Fee { get; set; }
}