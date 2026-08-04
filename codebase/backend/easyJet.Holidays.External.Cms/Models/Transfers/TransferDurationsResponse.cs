using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Transfers
{
    /// <summary>
    /// Response for getting all transfer durations
    /// </summary>
    public class TransferDurationsResponse : JsonApiResponse<Dictionary<string, int>>
    {
        /// <inheritdoc />
        public override ApiError[] ApiErrors => []; // Don't handle response body errors
    }
}
