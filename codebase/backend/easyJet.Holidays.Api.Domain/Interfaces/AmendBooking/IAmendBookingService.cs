using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    public interface IAmendBookingService
    {
        /// <summary>
        /// Amend booking with price validation
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<BookingResponse> AmendBooking(AmendBookingRequest request);
    }
}