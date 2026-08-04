using easyJet.Holidays.External.Voucherify.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Voucherify.Models
{
    public class CustomerUpdateRequest : VJsonApiRequest<CustomerUpdateRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Put;
    }

    [DataContract]
    public class CustomerUpdateRequestBody
    {
        [DataMember(Name = "source_id")]
        public string SourceId { get; set; }

        [DataMember(Name = "name")]
        public string Name { get; set; }
    }
}
