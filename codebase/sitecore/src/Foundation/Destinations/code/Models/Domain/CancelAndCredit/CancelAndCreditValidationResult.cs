namespace easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit
{
    public class CancelAndCreditValidationResult
    {
        /// <summary>
        /// Gets or sets airport name which already selected in another cancel and credit rule.
        /// </summary>
        public string AirportName { get; set; }

        /// <summary>
        /// Gets or sets cancel and credit rule name which contains already selected airports.
        /// </summary>
        public string CancelAndCreditRuleName { get; set; }

        /// <summary>
        /// Gets or sets cancel and credit folder name rule name which contains already selected airports.
        /// </summary>
        public string CancelAndCreditFolderName { get; set; }
    }
}