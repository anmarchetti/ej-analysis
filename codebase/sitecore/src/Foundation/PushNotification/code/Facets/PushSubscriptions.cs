using System;
using System.Collections.Generic;
using Sitecore.XConnect;

namespace easyJet.Foundation.PushNotifications.Facets
{
    /// <summary>
    /// Represents push subscriptions facet.
    /// </summary>
    [Serializable]
    [FacetKey(DefaultFacetKey)]
    public class PushSubscriptions : Facet
    {
        public const string DefaultFacetKey = "PushSubscriptions";

        /// <summary>
        /// Gets or sets Subscriptions where 'key' is Device Id for Contact.
        /// </summary>
        public Dictionary<Guid, PushSubscription> Subscriptions { get; set; } = new Dictionary<Guid, PushSubscription>();
    }
}