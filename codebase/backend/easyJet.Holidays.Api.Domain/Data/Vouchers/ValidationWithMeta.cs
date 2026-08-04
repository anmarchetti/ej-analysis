using Newtonsoft.Json;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    /// <summary>
    /// extension to OOB Validation response to surface Campaign Metadata
    /// </summary>
    [JsonObject]
    public class ValidationWithMeta : VVoucherify.DataModel.ValidationVoucher
    {
        [JsonProperty(PropertyName = "metadata")]
        public Dictionary<string, object> Metadata { get; set; }
    }
}
