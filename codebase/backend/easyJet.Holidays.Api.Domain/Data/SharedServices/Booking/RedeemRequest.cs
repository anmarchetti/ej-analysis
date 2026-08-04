using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;

public class RedeemRequest
{
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public string BookingReference { get; set; }
    public string AccomCode { get; set; }
    public string CustomerId { get; set; }
    public string BookingMarketCode { get; set; }
    public RedemptionMetadata RedemptionMetadata { get; set; }
}