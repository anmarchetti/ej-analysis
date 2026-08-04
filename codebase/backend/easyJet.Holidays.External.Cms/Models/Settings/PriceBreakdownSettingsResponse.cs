using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Settings
{
    public class PriceBreakdownSettingsResponse : JsonApiResponse<Dictionary<string, PriceBreakdownCategory>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
