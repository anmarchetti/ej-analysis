using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;

public class GetBookingUnsafeRequest
{
    public string BookingReference { get; set; }
    public GetBookingOptions GetBookingOptions { get; set; }
}