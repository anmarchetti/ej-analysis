using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    /// <summary>
    /// Whitelist of allowed trade agent names
    /// </summary>
    [Serializable]
    [DataContract]
    public class AllowedTradeAgentNamesSettings
    {
        [DataMember(Name = "ConsultantNames")]
        public string TradeAgentNamesString { get; set; }

        [DataMember(Name = "Enabled")]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool Enabled { get; set; }

        private static string[] _splitters = { "\r\n", "\t" };

        public IEnumerable<string> TradeAgentNames =>
            TradeAgentNamesString?.Split(_splitters, StringSplitOptions.RemoveEmptyEntries);
    }
}