using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Destinations.Titles
{
    public class DestinationTitlesRequestBody
    {
        public string[] Codes { get; set; }

        public string Query { get; set; }

        public int Page { get; set; }

        public int Take { get; set; }

        public DestinationFilter Filter { get; set; }
    }

    public class DestinationTitlesRequest : JsonApiRequest<DestinationTitlesRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
