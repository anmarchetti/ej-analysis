using System;
using System.Collections.Generic;

namespace easyJet.Foundation.PushNotifications.Facets
{
    [Serializable]
    public class UserSearch
    {
        /// <summary>
        /// Gets or sets searched airports.
        /// </summary>
        public List<TrackingItem> Airports { get; set; }

        /// <summary>
        /// Gets or sets searched destinations.
        /// </summary>
        public List<TrackingItem> Destinations { get; set; }

        /// <summary>
        /// Gets or sets searched start date of holiday.
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Gets or sets searched end date of holiday.
        /// </summary>
        public DateTime EndDate { get; set; }
    }
}