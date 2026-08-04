using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Domain.Models.LivePrice;

public class LivePriceSettingsResponse : JsonApiResponse<LivePriceSearchesResponseBody>
{
    public override ApiError[] ApiErrors => null; // Don't handle response body errors
}
