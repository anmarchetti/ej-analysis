using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    [Serializable]
    [DataContract]
    public class MyCreditInfo
    {
        [DataMember(Name = "balance")]
        public decimal Balance { get; set; }

        [DataMember(Name = "currency")]
        public string Currency { get; set; }

        [DataMember(Name = "hasCreditHistory")]
        public bool HasCreditHistory { get; set; }

        /// <summary>
        /// Whether credits are enabled and can be used to pay for the booking
        /// By default it's <code>true</code>.
        /// </summary>
        [DataMember]
        public bool CreditIsEnabled { get; set; } = true;
    }
}
