using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    /// <summary>
    /// Cache busting setting domain model for promo
    /// </summary>
    [Serializable]
    [DataContract]
    public class PromoCacheBustingSetting
    {
        /// <summary>
        /// Cache busting query value 
        /// </summary>
        [DataMember]
        public string QueryValue { get; set; }
    }
}