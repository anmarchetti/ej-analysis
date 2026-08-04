using System;
using System.Collections.Generic;
using easyJet.Feature.PushNotifications.Exceptions;
using easyJet.Foundation.PushNotifications.Facets;

namespace easyJet.Feature.PushNotifications.Services
{
    public interface IPushSubscriptionService
    {
        /// <summary>
        /// Update push subscription facet by device ID.
        /// </summary>
        /// <param name="deviceId">Device ID.</param>
        /// <param name="pushSubscription">Push subsctiption facet.</param>
        void Update(Guid deviceId, PushSubscription pushSubscription);

        /// <summary>
        /// Remove push subscription from contact by provided push subscription.
        /// </summary>
        /// <param name="contactId">Contact Id.</param>
        /// <param name="candidateToRemove">Push subsctiption candidate for removing.</param>
        /// <exception cref="PushSubscriptionException">Throws when can not remove push subscription from the contact.</exception>
        void Remove(Guid contactId, PushSubscription candidateToRemove);

        /// <summary>
        /// Remove push subscription from contact by provided push subscription.
        /// </summary>
        /// <param name="contactSubscriptions">Dictionary of contact ID and Push subscription facet.</param>
        void Remove(Dictionary<Guid, PushSubscription> contactSubscriptions);

        /// <summary>
        /// Search push subscription by Safari token.
        /// </summary>
        /// <param name="token">Safari token.</param>
        /// <returns>Dictionary of contact ID and Push subscription facet.</returns>
        Dictionary<Guid, PushSubscription> Search(string token);
    }
}
