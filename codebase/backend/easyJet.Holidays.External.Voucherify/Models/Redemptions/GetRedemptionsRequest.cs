using easyJet.Holidays.External.Voucherify.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Voucherify.Models
{
    public class GetRedemptionsRequest : VJsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "customer")]
        public string Customer { get; set; }

        /// <summary>
        /// Limits the number of objects to be returned. The limit can range between 1 and 100 items. If no limit is set, it returns 100 items.
        ///
        /// Required range: 1 is less or equal than Limit is less or equal 100
        /// </summary>
        [DataMember(Name = "limit")]
        public int Limit { get; set; } = 100;
        
        /// <summary>
        /// Which page of results to return. The lowest value is 1, the highest value is 99.
        ///
        /// Required range: 1 is less or equal than  x is less or equal than  99
        /// </summary>
        [DataMember(Name = "page")]
        public int Page { get; set; } = 1;
    }
}
