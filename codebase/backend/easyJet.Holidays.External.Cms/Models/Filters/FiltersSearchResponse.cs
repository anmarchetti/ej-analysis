using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class FiltersSearchResponseBody
    {
        public List<HotelFilters> Filters { get; set; }
    }

    public class FiltersSearchResponse : JsonApiResponse<List<HotelFilters>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
