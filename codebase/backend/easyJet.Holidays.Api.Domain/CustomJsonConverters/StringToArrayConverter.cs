using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.CustomJsonConverters;

/// <summary>
/// Converts string with comma separated values into array of T
/// </summary>
/// <typeparam name="T"></typeparam>
public class StringToArrayConverter<T> : JsonConverter
{
    /// <inheritdoc />
    public override bool CanConvert(Type objectType)
    {
        return objectType == typeof(string[]);
    }

    /// <inheritdoc />
    public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
    {
        var stringValue = (string)reader.Value;
        return stringValue?.Split(',').Select(x => (T)Convert.ChangeType(x.Trim(), typeof(T))).ToArray();
    }

    /// <inheritdoc />
    public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
    {
        var arrayValue = (IEnumerable<T>)value;
        writer.WriteValue(string.Join(", ", arrayValue));
    }
}