using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    public interface IValidationAmendmentsService
    {
        /// <summary>
        /// Validate whether the booking can be amended
        /// Add validation error to AmendmentInfo.AmendBookingStatus list.
        /// </summary>
        /// <param name="bookingResponse">Booking response.</param>
        /// <param name="memo">Booking memo.</param>
        /// <param name="amendBookingSettings">Amend booking settings.</param>
        Task ValidateAmendments(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings);
    }
}
