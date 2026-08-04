using System;

namespace easyJet.Foundation.PushNotifications.Facets
{
    /// <summary>
    /// Represents Tracking Item facet. Part of <see cref="UserSearch "/> facet.
    /// </summary>
    [Serializable]
    public class TrackingItem
    {
        /// <summary>
        /// Gets or Sets Sitecore Item's Id.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or Sets Sitecore Item's Code.
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Gets or Sets Sitecore Item's Name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or Sets Sitecore Item's Type.
        /// </summary>
        public string Type { get; set; }
    }
}