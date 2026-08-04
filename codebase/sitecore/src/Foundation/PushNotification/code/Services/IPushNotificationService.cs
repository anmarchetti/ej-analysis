using System.Collections.Generic;
using easyJet.Foundation.PushNotifications.Models.Domain;

namespace easyJet.Foundation.PushNotifications.Services
{
    public interface IPushNotificationService
    {
        /// <summary>
        /// Send push notification.
        /// </summary>
        /// <param name="subscriptions">Collection of push subscrition.</param>
        /// <param name="message">Push notification message.</param>
        void SendNotification(List<Facets.PushSubscription> subscriptions, NotificationMessage message);
    }
}