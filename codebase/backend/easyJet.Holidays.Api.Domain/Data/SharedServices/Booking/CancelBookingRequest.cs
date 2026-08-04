namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;

public class CancelBookingRequest
{
    public string BookingReference { get; set; }
    public string Reason { get; set; }
    public bool WithoutFee { get; set; }
    public string MarketCode { get; set; }
    public string Language { get; set; }
}