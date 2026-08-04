using System;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.XConnect.Common.Facets.ChatBot
{
    /// <summary>
    /// Chat Bot message.
    /// </summary>
    [Serializable]
    public class ChatBotMessage
    {
        public string SessionId { get; set; }

        [PIISensitive]
        public string Query { get; set; }

        public ConversationSource ConversationSource { get; set; }

        public string Intent { get; set; }

        public string ReferrerIntent { get; set; }

        public DateTime Timestamp { get; set; }
    }
}