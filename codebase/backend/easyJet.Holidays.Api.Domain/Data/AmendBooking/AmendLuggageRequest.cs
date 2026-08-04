using easyJet.Holidays.Api.Domain.Data.Booking;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking;

/// <summary>
/// Change luggage request, post booking flow.
/// </summary>
public class AmendLuggageRequest
{
    /// <summary>
    /// The booking reference.
    /// </summary>
    /// <value>
    /// The booking reference.
    /// </value>
    [DataMember(Name = "bookingReference")]
    [Required]
    public string BookingReference { get; set; }

    /// <summary>
    /// Luggage to book
    /// </summary>
    [DataMember(Name = "extraLuggageInfo")]
    public ExtraLuggageInfo ExtraLuggageInfo { get; set; }
}