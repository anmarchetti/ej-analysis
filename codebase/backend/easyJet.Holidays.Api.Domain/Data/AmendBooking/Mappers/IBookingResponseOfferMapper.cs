using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers
{
    public interface IBookingResponseOfferMapper
    {
        Offer Map(BookingResponse bookingResponse);
    }
}
