using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.CustomJsonConverters
{
    /// <summary>
    /// Converts boolean in manner, so it corresponds to what Sitecore returns for checkbox field value
    /// </summary>
    public class SiteCoreBooleanConverter : JsonConverter
    {
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            writer.WriteValue((bool)value ? "1" : "");
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            return reader.Value.ToString() == "1";
        }

        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(bool);
        }
    }
}