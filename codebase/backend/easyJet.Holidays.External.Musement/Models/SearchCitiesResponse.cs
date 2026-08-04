using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Musement.Models
{
    public class SearchCitiesResponse : JsonApiResponse<SearchCitiesResponseBody[]>
    {
        public override ApiError[] ApiErrors => null;
    }
}
