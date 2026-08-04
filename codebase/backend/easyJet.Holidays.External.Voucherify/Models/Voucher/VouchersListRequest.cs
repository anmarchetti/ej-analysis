using easyJet.Holidays.External.Voucherify.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class VouchersListRequest : VJsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "customer")] public string Customer { get; set; }

        [DataMember(Name = "limit")] public int Limit { get; set; }

        [DataMember(Name = "page")] public int Page { get; set; }

        [DataMember(Name = "[filters][type][conditions][$is][0]")]
        public string VoucherType { get; set; }

        [DataMember(Name = "[filters][expiration_date][conditions][$after][0]")]
        public string ExpirationDateAfter { get; set; }

        [DataMember(Name = "[filters][expiration_date][conditions][$before][0]")]
        public string ExpirationDateBefore { get; set; }

        [DataMember(Name = "[filters][active][conditions][$active]")]
        public bool? OnlyActive { get; set; }

        [DataMember(Name = "[filters][junction]")]
        public string FiltersJunctionParam { get; } = "and";
    }
}