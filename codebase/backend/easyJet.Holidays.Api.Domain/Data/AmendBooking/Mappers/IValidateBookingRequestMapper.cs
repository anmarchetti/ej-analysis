using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers
{
    public interface IValidateBookingRequestMapper
    {
        ValidateBookingRequest BuildValidateBookingRequest(BookingResponse bookingResponse, ValidateAmendBookingResponse alternativePackage);
    }
}
