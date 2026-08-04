using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;

public class AmendDateInfoRequest : IValidatableObject
{
    /// <summary>
    /// First day in response
    /// </summary>
    [Required]
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Last day in response
    /// </summary>
    [Required]
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Booking days ammount
    /// </summary>
    [Required]
    public int Duration { get; set; }

    /// <summary>
    /// List of departure. Delimiter ','
    /// </summary>
    [Required]
    public string Departure { get; set; }

    /// <summary>
    /// Room information
    /// </summary>
    public IEnumerable<RoomAllocation> Room { get; set; }

    /// <summary>
    /// Child ages list. Delimiter ','
    /// </summary>
    public string ChildAges { get; set; }

    /// <summary>
    /// Accommodation id
    /// </summary>
    [Required]
    public string AccommodationId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Room.Any(x => x.Children > 0) && string.IsNullOrEmpty(ChildAges))
        {
            yield return new ValidationResult($"Child ages is required.");
        }
    }
}