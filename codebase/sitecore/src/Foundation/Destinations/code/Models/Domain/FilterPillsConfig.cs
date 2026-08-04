using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Filter pills configuration.
    /// </summary>
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