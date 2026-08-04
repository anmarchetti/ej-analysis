using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Filters
{
    public class OfferFiltersResponse : JsonApiResponse<OfferFilterOptions>
    {
        public override ApiError[] ApiErrors => null;
    }
}