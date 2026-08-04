using System;
using System.Collections.Generic;
using Sitecore.XConnect;

namespace easyJet.Foundation.XConnect.Common.Facets.Email
{
    /// <summary>
    /// Emails List Facet.
    /// </summary>
    [Serializable]
    [FacetKey(DefaultFacetKey)]
    public class EmailsListFacet : Facet
    {
        public const string DefaultFacetKey = "EmailsList";

        /// <summary>
        /// Received emails.
        /// </summary>
        public List<Email> Emails { get; set; }
    }
}