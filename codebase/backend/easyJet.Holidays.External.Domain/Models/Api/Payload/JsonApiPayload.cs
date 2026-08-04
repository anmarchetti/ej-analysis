using Newtonsoft.Json;

namespace easyJet.Holidays.External.Domain.Models.Api.Payload
{
    public class JsonApiPayload<T> : ApiPayload<T>
    {
        protected override T DoDeserialize(string value)
        {
            return JsonConvert.DeserializeObject<T>(value);
        }

        protected override string DoSerialize(T value)
        {
            if (value == null) return null;
            return JsonConvert.SerializeObject(value, new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore,
            });
        }
    }
}
