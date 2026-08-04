using easyJet.Holidays.Api.Domain.Data.LivePrice;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    /// <summary>
    /// Credit and Cash Refund settings
    /// </summary>
    [DataContract]
    public class CreditAndCashRefundSettings
    {
        /// <summary>
        /// Indicates if one time use credit is enabled or not
        /// </summary>
        [DataMember]
        public bool EnableOneTimeUseCredit { get; set; }

        /// <summary>
        /// Indicates if amendment fee is enabled or not
        /// </summary>
        [DataMember]
        public bool EnableAmendmentFee { get; set; }

        /// <summary>
        /// Indicates the number of days before departure date when one time use credit should be applied
        /// </summary>
        [DataMember]
        public int? ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture { get; set; }

        /// <summary>
        /// Indicates the number of days before departure date when only original payment method should be shown
        /// </summary>
        [DataMember]
        public int? ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture { get; set; }

        /// <summary>
        /// Indicates the date from which the current rules apply for holidays booked
        /// </summary>
        [DataMember]
        public DateTime CurrentRulesApplyForHolidaysBookedFrom { get; set; }

        /// <summary>
        /// Indicates the number of days before departure date when refunds are allowed
        /// </summary>
        [DataMember]
        public int CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture { get; set; }

        /// <summary>
        /// Indicates the number of days before departure date when refunds were allowed in the past
        /// </summary>
        [DataMember]
        public int PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture { get; set; }

        /// <summary>
        /// Credit only rules for destinations between N and 28 days
        /// </summary>
        [DataMember]
        public IEnumerable<CreditOnlyRefundRule> CreditOnlyRules { get; set; }

        /// <summary>
        /// Booking references which will be processed without any validation
        /// </summary>
        [DataMember]
        public IEnumerable<string> ExemptionList { get; set; }

        /// <summary>
        /// Indicates the allowed amount of failures when calling cancellations in the Atcom before throw an error
        /// </summary>
        [DataMember]
        public int AllowedAmountOfFailures { get; set; } 
    }

    /// <summary>
    /// Credit and cash refund rule model
    /// </summary>
    [Serializable]
    [DataContract]
    public class CreditOnlyRefundRule : CreditAndCashRefundBaseRule
    {
    }

    /// <summary>
    /// Credit and cash refund base rule
    /// </summary>
    [Serializable]
    [DataContract]
    [KnownType(typeof(CreditOnlyRefundRule))]
    public class CreditAndCashRefundBaseRule
    {
        /// <summary>
        /// Activation start and end dates (including borders)
        /// </summary>
        [DataMember]
        public DateRange Active { get; set; }

        /// <summary>
        /// Number of days before departure date
        /// </summary>
        [DataMember]
        public int DaysBeforeDeparture { get; set; }

        /// <summary>
        /// Collection of destination airport codes
        /// </summary>
        [DataMember]
        public IEnumerable<string> DestinationAirports { get; set; }

        /// <summary>
        /// Gets or sets booking departure date from.
        /// </summary>
        [DataMember]
        public DateTimeOffset? BookingDepartureDateFrom { get; set; }

        /// <summary>
        /// Gets or sets booking departure date to.
        /// </summary>
        [DataMember]
        public DateTimeOffset? BookingDepartureDateTo { get; set; }

        /// <summary>
        /// Gets or sets booked within date from.
        /// </summary>
        [DataMember]
        public DateTimeOffset? BookedWithinDateFrom { get; set; }

        /// <summary>
        /// Gets or sets booked within date to.
        /// </summary>
        [DataMember]
        public DateTimeOffset? BookedWithinDateTo { get; set; }

        /// <summary>
        /// Gets or sets date of change from.
        /// </summary>
        [DataMember]
        public DateTimeOffset? DateOfChangeFrom { get; set; }

        /// <summary>
        /// Gets or sets date of change to.
        /// </summary>
        [DataMember]
        public DateTimeOffset? DateOfChangeTo { get; set; }
    }
}