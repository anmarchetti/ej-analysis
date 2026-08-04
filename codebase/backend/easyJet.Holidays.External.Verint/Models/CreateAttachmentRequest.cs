using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Verint.Models
{
    public class CreateAttachmentRequest : ApiRequest
    {
        public override HttpMethod Method => HttpMethod.Post;
        public override string PayloadString => null;
        public override HttpRequestMessage HttpRequestMessage { get; set; }
    }
}