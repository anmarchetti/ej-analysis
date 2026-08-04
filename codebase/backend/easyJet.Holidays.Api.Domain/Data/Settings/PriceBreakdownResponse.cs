using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    /// <summary>
    /// Price Categories response model
    /// </summary>
    [Serializable]
    [DataContract]
    public class PriceBreakdownResponse
    {
        /// <summary>
        /// Price Categories. key is Atcom code; value is {internal code, name}
        /// </summary>
        [DataMember]
        public Dictionary<string, PriceBreakdownCategory> PriceCategories { get; set; }
    }
}
