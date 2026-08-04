using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Factories.PromoCodeBreakDownFactory
{
    public interface IPromoCodeBreakDownFactory
    {
        PromoCodeBreakDown Create(ValidateAmendBookingResponse amendBookingInfo, BookingResponse bookingResponse);
    }
}
