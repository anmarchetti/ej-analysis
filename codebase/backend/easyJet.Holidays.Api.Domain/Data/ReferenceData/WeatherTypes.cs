using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    [Serializable]
    public class WeatherTypes
    {
        [JsonProperty("Children")]
        public List<WeatherType> Children { get; set; }
    }
}
