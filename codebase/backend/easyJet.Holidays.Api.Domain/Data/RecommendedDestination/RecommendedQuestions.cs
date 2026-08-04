using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.RecommendedDestination
{
    /// <summary>
    /// Recommended Destination.
    /// </summary>
    [Serializable]
    [DataContract]
    public class RecommendedQuestions
    {
        /// <summary>
        /// Collection of available months.
        /// </summary>
        [JsonProperty("availableMonths")]
        public int[] Months { get; set; }
    }
}
