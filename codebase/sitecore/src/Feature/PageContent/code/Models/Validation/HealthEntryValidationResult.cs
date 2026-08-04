namespace easyJet.Feature.PageContent.Models.Validation
{
    /// <summary>
    /// Models describes health/entry requirement validation result.
    /// </summary>
    public class HealthEntryValidationResult
    {
        /// <summary>
        /// Gets or sets airport name which already selected in another health/entry requirement block.
        /// </summary>
        public string AirportName { get; set; }

        /// <summary>
        /// Gets or sets health/entry requirement block name which contains already selected airports.
        /// </summary>
        public string HealthEntryRequirementBlockName { get; set; }
    }
}