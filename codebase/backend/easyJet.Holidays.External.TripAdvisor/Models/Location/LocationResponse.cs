using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels.Reviews;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Dflo.Models.Search
{
    public class LocationResponse : JsonApiResponse<HotelReviews>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
