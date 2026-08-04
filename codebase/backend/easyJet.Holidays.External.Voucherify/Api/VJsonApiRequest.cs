using easyJet.Holidays.External.Domain.Models.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using Newtonsoft.Json;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Api
{
    /// <summary>
    /// Voucherify specific Api request
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class VJsonApiRequest<T> : JsonApiRequest<T>
    {
        public override JsonApiPayload<T> Payload { get; set; } = new VJsonApiPayload<T>();
    }

    public abstract class VJsonApiResponse<T> : JsonApiResponse<T>
    {
        public override JsonApiPayload<T> Payload { get; set; } = new VJsonApiPayload<T>();
    }

    /// <summary>
    /// Payload with extra Converters for Voucherify models
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class VJsonApiPayload<T> : JsonApiPayload<T>
    {
        protected override T DoDeserialize(string value)
        {
            return JsonConvert.DeserializeObject<T>(value, Settings());
        }

        protected override string DoSerialize(T value)
        {
            if (value == null) return null;
            return JsonConvert.SerializeObject(value, Settings());
        }

        private JsonSerializerSettings Settings()
        {
            return new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore,
                Converters = new List<JsonConverter>()
                {
                    new VVoucherify.Core.Serialization.MetadataConverter(),
                    new VVoucherify.Core.Serialization.JsonEnumValueConverter()
                },
                DateFormatString = "yyyy-MM-ddTHH:mm:ssZ"
            };
        }
    }
}
