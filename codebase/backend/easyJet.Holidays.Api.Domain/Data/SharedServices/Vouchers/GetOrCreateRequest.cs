using easyJet.Holidays.Api.Domain.Data.Authentication;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;

public class GetOrCreateRequest
{
    public string CustomerId { get; set; }
    public CustomerDetails CustomerDetails { get; set; }
}