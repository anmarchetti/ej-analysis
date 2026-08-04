using Newtonsoft.Json;
namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    [JsonObject]
    public class Redemption : Voucherify.DataModel.Redemption, IVoucherifyObject
    {
    }
}
