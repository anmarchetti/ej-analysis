using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;

public class RollbackRequest
{
    public List<CreditSpend> SpendVoucherResult { get; set; }
    public string CustomerId { get; set; }
}