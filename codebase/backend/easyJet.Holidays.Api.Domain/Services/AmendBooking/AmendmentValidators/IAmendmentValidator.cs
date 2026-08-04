using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    public interface IAmendmentValidator
    {
        /// <summary>
        /// Validate whether the booking can be amended
        /// Add validation error to AmendmentInfo.AmendBookingStatus list.
        /// </summary>
        /// <param name="bookingResponse">Booking response.</param>
        /// <param name="memo">Booking memo.</param>
        /// <param name="amendBookingSettings">Amend booking settings</param>
        Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings);
    }
}