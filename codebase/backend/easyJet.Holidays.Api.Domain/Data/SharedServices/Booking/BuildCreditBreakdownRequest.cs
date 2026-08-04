using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;

public class BuildCreditBreakdownRequest
{
    public BookingResponse Booking { get; set; }
    public RefundRules Rules { get; set; }
    public EligibleAction Action { get; set; }
}