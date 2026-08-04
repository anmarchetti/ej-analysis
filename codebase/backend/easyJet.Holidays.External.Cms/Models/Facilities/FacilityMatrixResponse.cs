using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Facilities
{
    /// <summary>
    /// Facility Matrix Response Model.
    /// </summary>
    public class FacilityMatrixResponse : JsonApiResponse<List<HotelTypeFilterConfiguration>>
    {
        /// <summary>
        /// Api Errors behaviour handling.
        /// </summary>
        public override ApiError[] ApiErrors => Array.Empty<ApiError>(); // Don't handle response body errors
    }
}
