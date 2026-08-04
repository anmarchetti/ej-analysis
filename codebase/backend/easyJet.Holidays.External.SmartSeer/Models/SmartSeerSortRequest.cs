using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.SmartSeer.Models
{
    public class SmartSeerSortRequest : JsonApiRequest<SmartSeerSortRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
