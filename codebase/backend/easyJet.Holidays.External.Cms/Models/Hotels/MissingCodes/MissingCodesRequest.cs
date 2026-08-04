using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Hotels
{
    // TODO: was used to request sitecore's api/DestinationsSearch/GetMissingCodes endpoint. check, if we need this endpoint at all
    public class MissingCodesRequest : JsonApiRequest<BaseByCodeRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
