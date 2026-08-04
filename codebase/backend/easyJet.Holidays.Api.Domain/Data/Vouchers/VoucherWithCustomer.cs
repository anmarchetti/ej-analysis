using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    /// <summary>
    /// Voucher model extension because of missing <code>holder_id</code> property
    /// </summary>
    [JsonObject]
    public class VoucherWithCustomer : Voucher
    {
        /// <summary>
        /// Voucher holder id
        /// </summary>
        [JsonProperty(PropertyName = "holder_id")]
        public string HolderId { get; private set; }
    }
}