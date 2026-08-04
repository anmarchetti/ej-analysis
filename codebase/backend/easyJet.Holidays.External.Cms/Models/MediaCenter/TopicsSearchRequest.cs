using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.MediaCenter
{
    public class TopicsSearchRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;
    }
}
