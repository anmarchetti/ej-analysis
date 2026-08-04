using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;

public class RefundNonCreditPaymentsRequest
{
    public BookingResponse Booking { get; set; }
}