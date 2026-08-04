using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;

public class SpendCreditRequest : BaseRequestWithVoucherSource
{
    public BookingResponse Booking { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public string CustomerId { get; set; }
    public RedemptionMetadata RedemptionMetadata { get; set; }
}