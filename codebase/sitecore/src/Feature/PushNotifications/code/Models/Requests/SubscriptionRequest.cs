using easyJet.Feature.PushNotifications.Models.Domain;

namespace easyJet.Feature.PushNotifications.Models.Requests
{
    /// <summary>
    /// Represents subscription request model.
    /// </summary>
    public class SubscriptionRequest
    {
        /// <summary>
        /// Gets or Sets Client Subsctiption.
        /// </summary>
        public PushSubscription Subscription { get; set; }
    }
}