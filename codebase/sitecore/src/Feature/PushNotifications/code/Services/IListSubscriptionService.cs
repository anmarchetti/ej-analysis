using System;
using System.Collections.Generic;
using easyJet.Feature.PushNotifications.Exceptions;

namespace easyJet.Feature.PushNotifications.Services
{
    public interface IListSubscriptionService
    {
        /// <summary>
        /// Unsubscribe contact from subscriptions list.
        /// </summary>
        /// <param name="contactId">Contact Id.</param>
        /// <exception cref="ListSubscriptionException">Throws when can not unsubscribe contact from subscription list.</exception>
        void Unsubscribe(Guid contactId);

        /// <summary>
        /// Unsubscribe contacts from subscriptions list.
        /// </summary>
        /// <param name="contactIds">Collection of contact id.</param>
        void Unsubscribe(IEnumerable<Guid> contactIds);
    }
}