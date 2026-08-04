using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking;

public class ValidationAmendmentsService : IValidationAmendmentsService
{
    private readonly IEnumerable<IAmendmentValidator> _amendmentValidators;

    public ValidationAmendmentsService(IEnumerable<IAmendmentValidator> amendmentValidators)
    {
        _amendmentValidators = amendmentValidators ?? new List<IAmendmentValidator>();
    }

    /// <summary>
    /// Validate whether the booking can be amended
    /// </summary>
    /// <param name="bookingResponse">Booking response.</param>
    /// <param name="memo">Booking memo.</param>
    /// <param name="amendBookingSettings">Amend booking settings.</param>
    public async Task ValidateAmendments(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
    {
        if (bookingResponse is null)
            return;

        foreach (var validator in _amendmentValidators)
        {
            await validator.Validate(bookingResponse, memo, amendBookingSettings);
        }
    }
}