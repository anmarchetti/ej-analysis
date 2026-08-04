using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Converters
{
    internal class DictionaryAsArrayConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return typeof(IDictionary<string, string>) == objectType;
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            var dict = value as IDictionary<string, string>;

            if (dict == null) return;

            writer.WriteStartArray();

            foreach (var keyValue in dict)
            {
                writer.WriteStartObject();
                writer.WritePropertyName(keyValue.Key);
                writer.WriteValue(keyValue.Value);
                writer.WriteEndObject();
            }
            writer.WriteEndArray();
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null)
            {
                return null;
            }

            if (reader.TokenType != JsonToken.StartArray)
            {
                return serializer.Deserialize<Dictionary<string, string>>(reader);
            }

            reader.Read();

            var dict = new Dictionary<string, string>();

            while (reader.TokenType != JsonToken.EndArray)
            {
                if (reader.TokenType == JsonToken.PropertyName)
                {
                    var key = reader.Value?.ToString();
                    var value = reader.ReadAsString();

                    if (key != null)
                        dict[key] = value;
                }

                reader.Read();
            }

            return dict;
        }
    }
}
