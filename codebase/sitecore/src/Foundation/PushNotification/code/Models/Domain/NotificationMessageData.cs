using Newtonsoft.Json;

namespace easyJet.Foundation.PushNotifications.Models.Domain
{
    public class NotificationMessageData
    {
        /// <summary>
        /// Gets or sets message's url.
        /// </summary>
        [JsonProperty("url")]
        public string Url { get; set; }

        /// <summary>
        /// Gets or sets message's Accommodation Code.
        /// </summary>
        [JsonProperty("accId")]
        public string AccommodationCode { get; set; }

        /// <summary>
        /// Gets or sets Contact Id.
        /// </summary>
        [JsonProperty("contactId")]
        public string ContactId { get; set; }

        /// <summary>
        /// Gets or sets Cta Label
        /// </summary>
        [JsonProperty("ctaLabel")]
        public string CtaLabel { get; set; }
    }
}