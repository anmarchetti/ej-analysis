using System;
using Sitecore.XConnect;

namespace easyJet.Foundation.Analytics.Models
{
    public class InteractionArgs
    {
        /// <summary>
        /// Gets or sets User Agent.
        /// </summary>
        public string UserAgent { get; set; }

        /// <summary>
        /// Gets or sets channel ID.
        /// </summary>
        public Guid ChannelId { get; set; }

        /// <summary>
        /// Gets or sets page event.
        /// </summary>
        public Event PageEvent { get; set; }
    }
}