using System;
using System.Collections.Generic;
using Sitecore.XConnect;

namespace easyJet.Foundation.PushNotifications.Facets
{
    /// <summary>
    /// Represents User's searches facet.
    /// </example>
    [Serializable]
    [FacetKey(DefaultFacetKey)]
    public class UserSearches : Facet
    {
        public const string DefaultFacetKey = "UserSearches";

        /// <summary>
        /// Gets or sets User's searches.
        /// </summary>
        public List<UserSearch> Searches { get; set; } = new List<UserSearch>();
    }
}