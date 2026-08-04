using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    /// <summary>
    /// Weather Type
    /// </summary>
    [Serializable]
    public class WeatherType
    {
        /// <summary>
        /// Weather type code.
        /// </summary>
        [JsonProperty("Code")]
        public string Code { get; set; }


        /// <summary>
        /// Minumum temparature
        /// </summary>
        [JsonProperty("TemperatureMin")]
        public sbyte? TemperatureMin { get; set; }

        /// <summary>
        /// Maximum temperature 
        /// </summary>
        [JsonProperty("TemperatureMax")]
        public sbyte? TemperatureMax { get; set; }
    }
}
