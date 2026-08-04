using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Airports
{
    public class CountriesResponse : JsonApiResponse<List<Country>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
