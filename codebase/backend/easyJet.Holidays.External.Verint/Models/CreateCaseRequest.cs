using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Verint.Models
{
    public class CreateCaseRequest : JsonApiRequest<CreateCaseRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}