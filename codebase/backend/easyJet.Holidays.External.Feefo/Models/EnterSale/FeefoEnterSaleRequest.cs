using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Feefo.Models.EnterSale
{
    internal class FeefoEnterSaleRequest : ApiRequest
    {
        public string PayloadFormData { get; set; }
        public override HttpMethod Method => HttpMethod.Post;
        public override string PayloadString => this.PayloadFormData;
    }
}
