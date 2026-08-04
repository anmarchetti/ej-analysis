using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Represents extended properties of Destination item
    /// (i.e. Country, Location, Resort or Accommodation).
    /// </summary>
    public class Destination : BaseDestinationItem
    {
        /// <summary>
        /// Gets or sets a value indicating whether gets or sets ShowOnSearchPod flag.
        /// </summary>
        public bool ShowOnSearchPod { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether gets or sets ShowOnDropdown flag.
        /// </summary>
        public bool ShowOnDropdown { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether gets or sets ShowInAutocomplete flag.
        /// </summary>
        public bool ShowInAutocomplete { get; set; }

        /// <summary>
        /// Gets or sets RelatedRegions collection.
        /// </summary>
        public IEnumerable<string> RelatedRegions { get; set; }

        /// <summary>
        /// Gets or sets RelatedResorts collection.
        /// </summary>
        public IEnumerable<string> RelatedResorts { get; set; }

        /// <summary>
        /// Gets or sets PromoCollections for Accommodations.
        /// </summary>
        public string[] PromoCollections { get; set; }

        /// <summary>
        /// Gets or sets tracking hotel theme.
        /// </summary>
        public string TrackingHotelTheme { get; set; }
    }
}