namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    /// <summary>
    /// Filter pills configuration.
    /// </summary>
    [Serializable]
    public class FilterPillsConfig
    {
        /// <summary>
        /// Gets or sets filter pill options.
        /// </summary>
        public IReadOnlyList<FilterPillOption> Options { get; set; } = new List<FilterPillOption>();

        /// <summary>
        /// Gets or sets recommended filter config
        /// </summary>
        public RecommendedFilterConfig RecommendedFilterConfig { get; set; }
    }
}