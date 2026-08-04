using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Destinations
{
    public class DestinationsResponse : JsonApiResponse<DestinationsResponseBody>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }

    public class DestinationsResponseBody
    {
        public List<DestinationItem> Destinations { get; set; }

        public int Total { get; set; }

        public int Page { get; set; }

        public int Take { get; set; }
    }
}
