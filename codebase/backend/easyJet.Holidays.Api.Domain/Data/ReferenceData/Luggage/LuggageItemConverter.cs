using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;

/// <summary>
/// Converts an LuggageItem to and from JSON.
/// </summary>
public class LuggageItemConverter : JsonConverter
{
    /// <inheritdoc />
    public override bool CanConvert(Type objectType)
    {
        ArgumentNullException.ThrowIfNull(objectType);

        return objectType == typeof(LuggageItemBase) || objectType.IsSubclassOf(typeof(LuggageItemBase));
    }

    /// <inheritdoc />
    public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
    {
        JObject jo = JObject.Load(reader);

        string type = jo["Type"]?.ToString();

        switch (type)
        {
            case "CombinedLuggageItem":
                return JsonConvert.DeserializeObject<CombinedLuggageItem>(jo.ToString());
            default:
                return JsonConvert.DeserializeObject<LuggageItem>(jo.ToString());
        }
    }

    /// <inheritdoc />
    public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
    {
        throw new NotImplementedException("WriteJson will not be used");
    }
}