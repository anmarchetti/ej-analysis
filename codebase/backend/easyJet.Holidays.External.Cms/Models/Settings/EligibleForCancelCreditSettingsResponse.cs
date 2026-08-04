using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Destinations
{
    public class EligibleForCancelCreditSettingsResponse : JsonApiResponse<CreditAndCashRefundSettings>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
