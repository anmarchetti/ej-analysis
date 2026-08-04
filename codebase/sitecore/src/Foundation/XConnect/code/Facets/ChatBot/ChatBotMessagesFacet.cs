using System;
using System.Collections.Generic;
using Sitecore.XConnect;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.XConnect.Common.Facets.ChatBot
{
    /// <summary>
    /// Chat Bot messages facet.
    /// </summary>
    [Serializable]
    [FacetKey(DefaultFacetKey)]
    public class ChatBotMessagesFacet : Facet
    {
        public const string DefaultFacetKey = "ChatBotMessage";

        /// <summary>
        /// Gets or sets chat bot messages.
        /// </summary>
        public List<ChatBotMessage> Messages { get; set; }
    }
}