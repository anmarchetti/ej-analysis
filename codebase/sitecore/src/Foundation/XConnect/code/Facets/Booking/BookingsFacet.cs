using System;
using System.Collections.Generic;
using Sitecore.XConnect;

namespace easyJet.Foundation.XConnect.Common.Facets.Booking
{
    /// <summary>
    /// Bookings Facet.
    /// </summary>
    [Serializable]
    [FacetKey(DefaultFacetKey)]
    public class BookingsFacet : Facet
    {
        public const string DefaultFacetKey = "Bookings";

        /// <summary>
        /// Gets or sets customer bookings.
        /// Key is a booking reference.
        /// </summary>
        public Dictionary<string, Booking> Bookings { get; set; }
    }
}