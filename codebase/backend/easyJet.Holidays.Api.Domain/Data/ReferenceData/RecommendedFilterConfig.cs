using System.Collections.Generic;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    /// <summary>
    /// Configuration payload for the recommended filters.
    /// </summary>
    [Serializable]
    public class RecommendedFilterConfig
    {
        /// <summary>
        /// Minimum number of offers required to return recommended options.
        /// </summary>
        public int MinNumberOfOffers { get; set; }

        /// <summary>
        /// Recommended options to show when the threshold is met.
        /// </summary>
        public IReadOnlyList<FilterPillOption> Options { get; set; } = [];
    }
}