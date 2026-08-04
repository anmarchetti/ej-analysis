using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{

    /// <summary>
    /// Model to describe availability for refund, credit
    /// </summary>
    [DataContract]
    public class EligibleForRefund
    {
        /// <summary>
        /// Credit refund
        /// </summary>
        [DataMember(Name = "credit")]
        public EligibleAction Credit { get; set; }

        /// <summary>
        /// Cash refund
        /// </summary>
        [DataMember(Name = "refund")]
        public EligibleAction Refund { get; set; }

        [DataMember(Name = "status")]
        public RefundStatus Status { get; set; } = RefundStatus.Ok;

        [IgnoreDataMember]
        public RefundRules Rules { get; set; } = RefundRules.Regular;
    }

    public enum RefundRules
    {
        /// <summary>
        /// Normal rules applied: deposit goes to credit, balance goes to cash or credit
        /// </summary>
        Regular,

        /// <summary>
        /// Cash refund is maximum 25%
        /// </summary>
        QuarterOfCashOrHalfOfCredit,

        /// <summary>
        /// Credit only, no cash refund
        /// </summary>
        CreditOnly,

        /// <summary>
        /// No refund on web site
        /// </summary>
        NoRefund,

        /// <summary>
        /// Rules for amend partial refuns
        /// </summary>
        PartialRefund
    }

    public enum RefundStatus
    {
        [EnumMember(Value = "OK")]
        Ok,

        [EnumMember(Value = "disabledByRules")]
        DisabledByRules,

        [EnumMember(Value = "disabledOnSite")]
        DisabledOnSite
    }

    [DataContract]
    public class EligibleAction
    {
        /// <summary>
        /// Whether specified action available 
        /// </summary>
        [DataMember(Name = "isEligible")]
        public bool IsEligible { get; set; }

        /// <summary>
        /// Credit amount available for action
        /// </summary>
        [DataMember(Name = "credit")]
        public decimal Credit { get; set; }

        /// <summary>
        /// Credit breakdown details
        /// </summary>
        [IgnoreDataMember]
        public CreditBreakdown CreditBreakdown { get; set; }

        /// <summary>
        /// Cash amount available for action
        /// </summary>
        [DataMember(Name = "cash")]
        public decimal Cash { get; set; }

        /// <summary>
        /// Collection of credits that will be lost if cancel a booking
        /// </summary>
        [DataMember(Name = "lostCreditsIfCancelled")]
        public List<string> LostCreditsIfCancelled { get; set; }
    }

    [DataContract]
    public class CreditBreakdown
    {
        /// <summary>
        /// Goodwill credit: usually it's deposit
        /// </summary>
        [DataMember]
        public decimal Goodwill { get; set; }

        /// <summary>
        /// Regular credits
        /// </summary>
        [DataMember]
        public decimal Refund { get; set; }

        /// <summary>
        /// Gift card credits amount. Part of this amount may be already part of goodwill
        /// </summary>
        [DataMember]
        public decimal GiftCard { get; set; }

        /// <summary>
        /// Promo credits sum
        /// </summary>
        [DataMember]
        public decimal Promo { get; set; }

        public decimal Total() => Goodwill + Refund + GiftCard + Promo;
    }
}