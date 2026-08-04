using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Recommended filter configuration.
    /// </summary>
    public class RecommendedFilterConfig
    {
        /// <summary>
        /// Gets or sets minimum number of offers required to return recommended options.
        /// </summary>
        public int MinNumberOfOffers { get; set; }

        /// <summary>
        /// Gets or sets filter pills to show when the threshold is met.
        /// </summary>
        public IReadOnlyList<FilterPillOption> Options { get; set; } = new List<FilterPillOption>();
    }
}