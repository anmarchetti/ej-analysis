using easyJet.Feature.PushNotifications.Models.Domain;

namespace easyJet.Feature.PushNotifications.Models.Requests
{
    /// <summary>
    /// Represents unsubscription request model.
    /// </summary>
    public class UnsubscriptionRequest
    {
        /// <summary>
        /// Gets or Sets Client Subsctiption.
        /// </summary>
        public PushSubscription Subscription { get; set; }

        /// <summary>
        /// Gets or Sets Contact Id.
        /// </summary>
        public string ContactId { get; set; }
    }
}