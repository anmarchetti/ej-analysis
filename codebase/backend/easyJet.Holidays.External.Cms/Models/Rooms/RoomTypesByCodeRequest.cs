using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class RoomTypesByCodeRequestBody : BaseByCodeRequest
    {
    }

    public class RoomTypesByCodeRequest : JsonApiRequest<RoomTypesByCodeRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
