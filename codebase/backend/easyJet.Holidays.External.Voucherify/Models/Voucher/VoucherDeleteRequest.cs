using easyJet.Holidays.External.Voucherify.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class VoucherDeleteRequest : VJsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Delete;

        [DataMember(Name = "force")]
        public bool Force { get; set; }
    }
}
