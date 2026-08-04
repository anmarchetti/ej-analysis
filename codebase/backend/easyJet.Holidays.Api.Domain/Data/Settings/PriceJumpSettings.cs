using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{

    [Serializable]
    [DataContract]
    public class PriceJumpSettings
    {
        [DataMember]
        public int? AllowedPriceDifference { get; set; }

        [DataMember]
        public int? MaxPriceJumpAmount { get; set; }

        [DataMember]
        public int? MaxPriceJumpAmountPP { get; set; }

        [DataMember]
        public int? MaxPriceJumpPercentage { get; set; }

        [DataMember]
        public int? MaxPriceJumpPercentagePP { get; set; }
    }
}
