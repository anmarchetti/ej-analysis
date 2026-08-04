using easyJet.Holidays.External.Domain.Models.Api.Payload;

namespace easyJet.Holidays.External.Domain.Models.Api
{
    public class JsonApiRequest<T> : ApiRequest
    {
        public virtual JsonApiPayload<T> Payload { get; set; } = new JsonApiPayload<T>();

        public override string PayloadString => Payload?.SerializedBody;
    }
}
