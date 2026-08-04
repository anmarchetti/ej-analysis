using Newtonsoft.Json.Linq;

namespace easyJet.Foundation.Destinations.Mappers
{
    public static class JObjectMapper
    {
        public static JObject ToJObject(string stringFormat)
        {
            if (string.IsNullOrEmpty(stringFormat))
            {
                return null;
            }

            return JObject.Parse(stringFormat);
        }
    }
}