using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.SmartSeer.Models
{
    public class SmartSeerRecommendationsRequest : JsonApiRequest<SmartSeerRecommendationsRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
