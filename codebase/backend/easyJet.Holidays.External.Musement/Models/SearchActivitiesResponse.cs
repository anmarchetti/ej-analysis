using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Musement.Models
{
    public class SearchActivitiesResponse : JsonApiResponse<ExcursionApiResponse>
    {
        public override ApiError[] ApiErrors => null;
    }

    public class ExcursionApiResponse
    {
        public List<SearchActivitiesResponseBody> Data { get; set; }
    }
}
