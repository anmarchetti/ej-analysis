using System;
using Sitecore.XConnect;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.XConnect.Common.Facets.CommunicationPreferences
{
    /// <summary>
    /// Communication Preferences Facet.
    /// </summary>
    [Serializable]
    [PIISensitive]
    [FacetKey(DefaultFacetKey)]
    public class CommunicationPreferencesFacet : Facet
    {
        public const string DefaultFacetKey = "CommunicationPreferences";

        /// <summary>
        /// <ref cref={CommunicationChannel} />
        /// </summary>
        public int Preferred { get; set; }

        public string WhatsAppNumber { get; set; }

        public string TwitterAccount { get; set; }

        public string FacebookAccount { get; set; }
    }
}