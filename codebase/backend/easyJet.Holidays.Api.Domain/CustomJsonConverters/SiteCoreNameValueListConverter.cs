using Newtonsoft.Json;
using System.Reflection;

namespace easyJet.Holidays.Api.Domain.CustomJsonConverters;

/// <summary>
/// Converts Sitecore name-value list into Dictionary with string keys
/// </summary>
public class SiteCoreNameValueListConverter<TValue> : JsonConverter
{
    public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
    {
        throw new NotSupportedException();
    }

    public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
    {
        IDictionary<string, TValue> value = new Dictionary<string, TValue>();
        string sourceValue = (string)reader.Value;

        if (string.IsNullOrWhiteSpace(sourceValue))
        {
            return value;
        }

        bool valuesAreStrings = typeof(TValue) == typeof(string);
        MethodInfo parseMethod = null;
        if (!valuesAreStrings)
        {
            parseMethod = typeof(TValue).GetMethod("Parse", new[] { typeof(string) });
            if (parseMethod == null)
            {
                throw new Exception($"{typeof(TValue)} doesn't have a Parse method which takes a string");
            }
        }

        foreach (string entry in sourceValue.Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            string[] parts = entry.Split('=', StringSplitOptions.RemoveEmptyEntries);
            value.Add(parts[0], (TValue)(parseMethod == null ? parts[1] : parseMethod.Invoke(null, new object[] { parts[1] })));
        }

        return value;
    }

    public override bool CanConvert(Type objectType)
    {
        return objectType == typeof(IDictionary<string, TValue>);
    }

    public override bool CanRead => true;
    public override bool CanWrite => false;
}