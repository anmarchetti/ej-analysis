using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Offer Filter Reordering Configuration.
    /// </summary>
    public class OfferFilterReordering
    {
        /// <summary>
        /// Gets or sets Offer Filter Code.
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Gets or sets Offer Filter Title.
        /// </summary>
        public IEnumerable<string> FilterOrder { get; set; }
    }
}