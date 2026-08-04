using System;
using Sitecore.XConnect;

namespace easyJet.Foundation.XConnect.Common.Facets.MarketingPreferences
{
    /// <summary>
    /// Marketing Preferences Facet.
    /// </summary>
    [Serializable]
    [FacetKey(DefaultFacetKey)]
    public class MarketingPreferencesFacet : Facet
    {
        public const string DefaultFacetKey = "MarketingPreferences";

        public bool FirstPartyMarketing { get; set; }

        public bool ThirdPartyMarketing { get; set; }

        public bool MarketResearchOptOut { get; set; }

        public bool DoNotContact { get; set; }
    }
}