using easyJet.Holidays.External.Domain.Models.Api.Payload;

namespace easyJet.Holidays.External.Domain.Models.Api
{
    public abstract class XmlApiResponse<T> : ApiResponse
    {
        public XmlApiPayload<T> Payload { get; set; } = new XmlApiPayload<T>();

        public override string PayloadString => Payload?.SerializedBody;

        public override void DeserializePayload(string payload)
        {
            Payload?.DeserializeBody(payload);
        }
    }
}
