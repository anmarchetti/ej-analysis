using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.PushNotifications.Models.Domain
{
    public class PushNotificationData
    {
        /// <summary>
        /// Gets or sets notification's subscriptions.
        /// </summary>
        [JsonProperty("subscriptions")]
        public List<PushSubscription> Subscriptions { get; set; }

        /// <summary>
        /// Gets or sets notification's message.
        /// </summary>
        [JsonProperty("message")]
        public NotificationMessage Message { get; set; }
    }
}