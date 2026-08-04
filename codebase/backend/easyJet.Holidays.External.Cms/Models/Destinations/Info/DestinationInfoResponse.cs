using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Destinations.Info
{
    /// <summary>
    /// Destination Info Response Model.
    /// </summary>
    public class DestinationInfoResponse : JsonApiResponse<DestinationInfo>
    {
        /// <inheritdoc/>
        public override ApiError[] ApiErrors => []; // Don't handle response body errors
    }
}
