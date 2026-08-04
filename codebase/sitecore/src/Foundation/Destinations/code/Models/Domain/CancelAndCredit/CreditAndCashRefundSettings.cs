using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit
{
    public class CreditAndCashRefundSettings
    {
        public int AllowedAmountOfFailures { get; set; }

        public bool EnableOneTimeUseCredit { get; set; }

        public bool EnableAmendmentFee { get; set; }

        public int ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture { get; set; }

        public int ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture { get; set; }

        public string CurrentRulesApplyForHolidaysBookedFrom { get; set; }

        public int CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture { get; set; }

        public int PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture { get; set; }

        /// <summary>
        /// Gets or Sets Cancel and Credit rules.
        /// </summary>
        public IEnumerable<CancelCreditRule> CancelAndCreditRules { get; set; }

        /// <summary>
        /// Gets or Sets Credit Only rules.
        /// </summary>
        public IEnumerable<CreditOnlyRule> CreditOnlyRules { get; set; }

        /// <summary>
        /// Gets or Sets Exemption List.
        /// </summary>
        public IEnumerable<string> ExemptionList { get; set; }
    }
}