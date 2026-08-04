using easyJet.Holidays.Api.Domain.Data.ContactUs;
using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.CustomJsonConverters;

/// <summary>
/// Converts Sitecore name-value  into ContactUsSendTo enum
/// </summary>
public class ContactUsSendToConverter : JsonConverter<ContactUsSendTo>
{
    public override ContactUsSendTo ReadJson(JsonReader reader, Type objectType, ContactUsSendTo existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.String)
        {
            string value = reader.Value.ToString();
            if (Enum.TryParse(value, true, out ContactUsSendTo sendTo))
            {
                return sendTo;
            }
        }

        return ContactUsSendTo.None;
    }

    public override void WriteJson(JsonWriter writer, ContactUsSendTo value, JsonSerializer serializer)
    {
        writer.WriteValue(value.ToString());
    }
}