using easyJet.Holidays.Api.Domain.Extensions;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking;

/// <summary>
/// Pax validation request model.
/// </summary>
[DataContract]
public class AmendPaxValidationRequest : IValidatableObject
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
    /// Passenger information.
    /// </summary>
    /// <value>
    /// Passenger information.
    /// </value>
    [DataMember(Name = "guests")]
    [Required]
    public AmendPersonWithDetails[] Guests { get; set; }

    /// <summary>
    /// Request validation.
    /// </summary>
    /// <param name="validationContext"></param>
    /// <returns>Validation result.</returns>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrEmpty(BookingReference))
        {
            yield return new ValidationResult($"{nameof(BookingReference)} can not be null or empty.");
        }

        if (Guests.IsNullOrEmpty())
        {
            yield return new ValidationResult($"{nameof(Guests)} can not be null.");
        }
    }
}