using System;
using System.Collections.Generic;
using System.Text;
using Sitecore.XConnect;

namespace easyJet.Foundation.PushNotifications.Facets
{
    /// <summary>
    /// Push Subscription facet.
    /// </summary>
    [Serializable]
    [FacetKey(DefaultFacetKey)]
    public class PushSubscription : Facet
    {
        public const string DefaultFacetKey = "PushSubscription";

        public string Endpoint { get; set; }

        public Dictionary<string, string> Keys { get; set; }

        public string Token { get; set; }

        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            if (!string.IsNullOrEmpty(Endpoint))
            {
                sb.Append($"Endpoint: {Endpoint}{Environment.NewLine}");
            }

            if (!string.IsNullOrEmpty(Token))
            {
                sb.Append($"Token: {Token}{Environment.NewLine}");
            }

            return sb.ToString();
        }
    }
}