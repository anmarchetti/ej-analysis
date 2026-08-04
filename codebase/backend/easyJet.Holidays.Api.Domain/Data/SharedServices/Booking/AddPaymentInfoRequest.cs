using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;

public class AddPaymentInfoRequest
{
    public List<CreditSpend> SpendVoucherResults { get; set; }
    public LeadPassenger LeadPassenger { get; set; }
    public string BookingReference { get; set; }
    public string SessionId { get; set; }
    public string RequestId { get; set; }
    public string BookingMarketCode { get; set; }
    public string BookingLanguage { get; set; }
}