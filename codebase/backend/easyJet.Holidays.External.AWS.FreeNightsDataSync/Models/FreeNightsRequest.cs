using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.AWS.FreeNightsDataSync.Models
{
    public class FreeNightsRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;
    }
}