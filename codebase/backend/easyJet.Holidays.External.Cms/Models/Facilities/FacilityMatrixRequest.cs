using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Facilities
{
    /// <summary>
    /// Facility Matrix Request model.
    /// </summary>
    public class FacilityMatrixRequest : JsonApiRequest<HotelTypeFilterConfiguration>
    {
        /// <summary>
        /// Request Method Type.
        /// </summary>
        public override HttpMethod Method => HttpMethod.Get;
    }
}
