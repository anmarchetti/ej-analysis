using easyJet.Holidays.Api.Domain.Extensions;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;

public class AmendRoomValidationRequest : IValidatableObject
{
    public AmendRoomVariant SelectedRoomVariant { get; set; }

    public IEnumerable<AmendRoomVariant> RoomVariants { get; set; }

    public string DiscountCode { get; set; }

    public string BookingRef { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrEmpty(BookingRef))
        {
            yield return new ValidationResult($"{nameof(BookingRef)} can not be null or empty.");
        }

        if (SelectedRoomVariant is null)
        {
            yield return new ValidationResult($"{nameof(SelectedRoomVariant)} can not be null.");
        }

        if (RoomVariants.IsNullOrEmpty())
        {
            yield return new ValidationResult($"{nameof(RoomVariants)} can not be empty.");
        }
    }
}