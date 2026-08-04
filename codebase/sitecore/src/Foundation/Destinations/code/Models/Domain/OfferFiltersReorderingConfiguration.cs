using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Offer Filters Reordering Configuration.
    /// </summary>
    public class OfferFiltersReorderingConfiguration
    {
        /// <summary>
        /// Gets or sets Experience Id.
        /// </summary>
        public string ExperienceId { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether is enabled.
        /// </summary>
        public bool IsEnabled { get; set; }

        /// <summary>
        /// Gets or sets Offer Filters.
        /// </summary>
        public IEnumerable<OfferFilterReordering> Filters { get; set; }
    }
}