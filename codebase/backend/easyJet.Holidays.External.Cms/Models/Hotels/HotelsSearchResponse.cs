using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class HotelsResponseBody
    {
        public Hotel[] Hotels { get; set; }
    }

    public class HotelsSearchResponse : JsonApiResponse<HotelsResponseBody>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
