using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;

public class AmendDatesSummaryRequest : IValidatableObject
{
    /// <summary>
    /// New booking date.
    /// </summary>
    [Required]
    public DateTime SelectedDate { get; set; }

    /// <summary>
    /// Description for room composition.
    /// </summary>
    public RoomAllocation[] Room { get; set; }

    /// <summary>
    /// List of ages for children. Required if booking has any child.
    /// </summary>
    public string ChildAges { get; set; }

    /// <summary>
    /// Accom board type.
    /// </summary>
    [Required]
    public string BoardType { get; set; }

    /// <summary>
    /// Full transfer code.
    /// </summary>
    public string TransferCode { get; set; }

    /// <summary>
    /// Bookings days count.
    /// </summary>
    [Required]
    public string Duration { get; set; }

    /// <summary>
    /// Accommodation id, e.g. ESTF0007 or X9133509
    /// </summary>
    [Required]
    public string AccomId { get; set; }

    /// <summary>
    /// Booking outbound flight departure time.
    /// </summary>
    [Required]
    public DateTimeOffset OutboundDepTime { get; set; }

    /// <summary>
    /// Booking inbound flight departure time.
    /// </summary>
    [Required]
    public DateTimeOffset InboundDepTime { get; set; }

    /// <summary>
    /// Booking reference
    /// </summary>
    [Required]
    public string BookingRef { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Room.Sum(x => x.Children) != (ChildAges?.Split(',').Where(x => !string.IsNullOrEmpty(x)).Count() ?? 0))
        {
            yield return new ValidationResult($"{nameof(ChildAges)} should contain age value for each child in booking.");
        }

        if (OutboundDepTime == default || InboundDepTime == default)
        {
            yield return new ValidationResult($"{nameof(OutboundDepTime)} or {nameof(InboundDepTime)} can not be null.");
        }
    }
}