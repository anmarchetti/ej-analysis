using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    /// <summary>
    /// Single Price category
    /// </summary>
    [Serializable]
    [DataContract]
    public class PriceBreakdownCategory
    {
        /// <summary>
        /// Internal code, for our usage only
        /// </summary>
        [DataMember]
        public string Code { get; set; }

        /// <summary>
        /// Text to be displayed on UI
        /// </summary>
        [DataMember]
        public string Text { get; set; }

        /// <summary>
        /// Scope of the price breakdown setting
        /// </summary>
        [DataMember]
        public PriceBreakdownCategoryScope Scope { get; set; }
    }

    /// <summary>
    /// Scope for price breakdown setting, to use it in different places
    /// </summary>
    [Flags]
    public enum PriceBreakdownCategoryScope
    {
        None = 0,
        BookingPage = 1,
        TradeAgentInfo = 2
    }
}
