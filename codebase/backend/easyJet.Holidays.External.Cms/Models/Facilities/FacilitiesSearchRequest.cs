using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class FacilitiesSearchRequestBody
    {
        public string[] AtcomIds { get; set; }
    }

    public class FacilitiesSearchRequest : JsonApiRequest<FacilitiesSearchRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
