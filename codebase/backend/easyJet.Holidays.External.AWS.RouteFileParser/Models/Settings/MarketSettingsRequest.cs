using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Models.Settings
{
    public class MarketSettingsRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;
    }
}
