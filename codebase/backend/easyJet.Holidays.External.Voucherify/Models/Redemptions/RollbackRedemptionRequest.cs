using easyJet.Holidays.External.Voucherify.Api;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Voucherify.Models.Spend
{
    public class RollbackRedemptionRequest : VJsonApiRequest<RollbackRedemptionBody>
    {
        public override HttpMethod Method => HttpMethod.Post;

        [DataMember(Name = "reason")]
        public string Reason { get; set; }
    }

    [JsonObject]
    public class RollbackRedemptionBody
    {
        [JsonProperty(PropertyName = "customer")]
        public RollbackRedemptionCustomer Customer { get; set; }
    }

    [JsonObject]
    public class RollbackRedemptionCustomer
    {
        [JsonProperty(PropertyName = "source_id")]
        public string SourceId { get; set; }
    }
}
