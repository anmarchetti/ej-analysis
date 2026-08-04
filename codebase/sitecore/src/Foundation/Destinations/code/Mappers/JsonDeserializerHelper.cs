using System;
using Newtonsoft.Json;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.Destinations.Mappers
{
    internal static class JsonDeserializerHelper
    {
        public static T TryDeserializeObject<T>(string value, string fieldName, Type ownerType)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return default;
            }

            try
            {
                return JsonConvert.DeserializeObject<T>(value);
            }
            catch (Exception ex)
            {
                Log.Error(
                    $"{ownerType?.Name ?? nameof(JsonDeserializerHelper)} could not deserialize JSON for '{fieldName}' into '{typeof(T).Name}'.",
                    ex,
                    ownerType ?? typeof(JsonDeserializerHelper));
                return default;
            }
        }
    }
}