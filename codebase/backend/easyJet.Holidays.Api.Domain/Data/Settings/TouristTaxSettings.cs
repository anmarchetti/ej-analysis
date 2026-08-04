using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using System.Collections.ObjectModel;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    /// <summary>
    /// Represents configuration settings related to tourist tax, including applicable weather types for children.
    /// </summary>
    [Serializable]
    [DataContract]
    public class TouristTaxSettings
    {
        /// <summary>
        /// Gets or sets if the tourist tax feature is enabled.
        /// </summary>
        [DataMember(Name = "IsTouristTaxEnabled")]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool IsTouristTaxEnabled { get; set; }
    }
}
