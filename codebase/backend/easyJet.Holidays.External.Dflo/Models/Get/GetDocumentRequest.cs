using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Dflo.Models.Search
{
    public class GetDocumentRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;
    }
}
