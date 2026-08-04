using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;

public class PaymentsAvailableForRefundRequest
{
    public BookingResponse Booking { get; set; }
}