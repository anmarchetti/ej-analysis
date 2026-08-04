using Newtonsoft.Json;
using VVoucherify = Voucherify;
namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    [JsonObject]
    public class Voucher : VVoucherify.DataModel.Voucher, IVoucherifyObject
    {
        [JsonProperty(PropertyName = "holder_id")]
        public string CustomerId { get; set; }
    }
}