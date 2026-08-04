using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;

public class BookingCancelationValidator : IAmendmentValidator
{
    public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
    {
        var cancellationHoursAmount = amendBookingSettings.CancellationRestrictionHours ?? 0;

        if (bookingResponse.BookingDate.AddHours(cancellationHoursAmount) > DateTime.UtcNow)
        {
            bookingResponse.AmendmentInfo.CanBookingCancelled = false;
            bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.CancellationDisabledByTimeBound);
        }
    }
}