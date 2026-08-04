using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Filters
{
    /// <summary>
    /// Response of getting filter pills config
    /// </summary>
    public class FilterPillsConfigResponse : JsonApiResponse<FilterPillsConfig>
    {
        /// <inheritdoc />
        public override ApiError[] ApiErrors => [];
    }
}