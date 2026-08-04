using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Hotels
{
    public class HotelsSummaryResponce : JsonApiResponse<List<HotelSummary>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
