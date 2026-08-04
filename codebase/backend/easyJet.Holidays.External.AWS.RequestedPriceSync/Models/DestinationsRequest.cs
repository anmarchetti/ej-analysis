using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Models
{
    public class DestinationsRequest : JsonApiRequest<DestinationsRequestRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }

    public class DestinationsRequestRequestBody
    {
        public string[] Codes { get; set; }

        public string Query { get; set; }

        public int Page { get; set; }

        public int Take { get; set; }

        public DestinationFilter Filter { get; set; }
    }
}