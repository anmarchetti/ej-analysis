using easyJet.Holidays.External.Voucherify.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Voucherify.Models.Customer
{
    class CustomersGetRequest : VJsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "email")]
        public string Email { get; set; }

        [DataMember(Name = "limit")]
        public string Limit { get; set; }
    }
}
