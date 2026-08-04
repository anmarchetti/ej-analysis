using easyJet.Holidays.External.Domain.Models.Api.Payload;

namespace easyJet.Holidays.External.Domain.Models.Api
{
    public abstract class JsonApiResponse<T> : ApiResponse
    {
        public virtual JsonApiPayload<T> Payload { get; set; } = new JsonApiPayload<T>();

        public override string PayloadString => Payload?.SerializedBody;

        public override void DeserializePayload(string payload)
        {
            Payload?.DeserializeBody(payload);
        }
    }
}
