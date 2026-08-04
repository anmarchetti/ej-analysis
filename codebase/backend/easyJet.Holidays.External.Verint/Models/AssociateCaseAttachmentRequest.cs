using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Verint.Models
{
    public class AssociateCaseAttachmentRequest : JsonApiRequest<AssociateCaseAttachmentRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}