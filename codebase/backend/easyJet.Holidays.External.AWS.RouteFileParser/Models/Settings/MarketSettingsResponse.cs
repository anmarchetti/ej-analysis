using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Models.Settings
{
    public class MarketSettingsResponse : JsonApiResponse<Dictionary<string, MarketSettings>>
    {
        public override ApiError[] ApiErrors => null;
    }
}
