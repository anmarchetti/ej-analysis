using Newtonsoft.Json;

namespace easyJet.Foundation.PushNotifications.Models.Domain
{
    /// <summary>
    /// Notification message model.
    /// </summary>
    public class NotificationMessage
    {
        /// <summary>
        /// Gets or sets message's title.
        /// </summary>
        [JsonProperty("title")]
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets message's body.
        /// </summary>
        [JsonProperty("body")]
        public string Body { get; set; }

        /// <summary>
        /// Gets or sets message's image.
        /// </summary>
        [JsonProperty("image")]
        public string Image { get; set; }

        /// <summary>
        /// Gets or sets message's icon.
        /// </summary>
        [JsonProperty("icon")]
        public string Icon { get; set; }

        /// <summary>
        /// Gets or sets message's click to action link.
        /// </summary>
        [JsonProperty("data")]
        public NotificationMessageData Data { get; set; }
    }
}