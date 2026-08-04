using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.PushNotifications.Exceptions;
using easyJet.Feature.PushNotifications.Logging;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.PushNotifications.Extenstions;
using easyJet.Foundation.PushNotifications.Facets;
using Sitecore.XConnect;
using Sitecore.XConnect.Client;

namespace easyJet.Feature.PushNotifications.Services
{
    /// <summary>
    /// Push subscription service contains methods for working with push subscription facets.
    /// </summary>
    [Service(typeof(IPushSubscriptionService), Lifetime = Lifetime.Transient)]
    public class PushSubscriptionService : AnalyticsServiceBase, IPushSubscriptionService
    {
        public PushSubscriptionService(IContactService contactService, IPushNotificationsLogger logger)
            : base(contactService, logger)
        {
        }

        /// <inheritdoc/>
        public void Update(Guid deviceId, PushSubscription pushSubscription)
        {
            Contact contact = null;
            try
            {
                using (IXdbContext client = GetClient())
                {
                    contact = GetCurrentTrackerContact(client, PushSubscriptions.DefaultFacetKey);
                    if (contact != null)
                    {
                        Logger.Debug($"Trying update the subscription [{pushSubscription}] for the contact [{contact.Id}]", this);
                        var pushSubscriptions = contact.Subscriptions();
                        if (pushSubscriptions == null)
                        {
                            pushSubscriptions = new PushSubscriptions();
                        }

                        if (!pushSubscriptions.Subscriptions.ContainsKey(deviceId))
                        {
                            pushSubscriptions.Subscriptions.Add(deviceId, pushSubscription);
                        }
                        else
                        {
                            pushSubscriptions.Subscriptions[deviceId] = pushSubscription;
                        }

                        AddPushNotificationsIdentifier(client, contact);
                        SetContactFacet(client, contact, pushSubscriptions, PushSubscriptions.DefaultFacetKey);

                        Logger.Debug($"The subscription [{pushSubscription}] has been successfully updated for the contact [{contact.Id}]", this);
                    }
                }
            }
            catch (XdbExecutionException ex)
            {
                Logger.Error($"Cannot update the {nameof(PushSubscription)} facet for contact: [{contact?.Id}] due to {ex.Message}", ex, this);
            }
        }

        /// <inheritdoc/>
        public void Remove(Guid contactId, PushSubscription candidateToRemove)
        {
            Contact contact = null;
            try
            {
                using (IXdbContext client = GetClient())
                {
                    contact = GetContactById(client, PushSubscriptions.DefaultFacetKey, contactId);

                    // If the contact cannot be resolved by ID. Get current tracker contact.
                    if (contact == null)
                    {
                        contact = GetCurrentTrackerContact(client, PushSubscriptions.DefaultFacetKey);
                    }

                    if (contact != null)
                    {
                        var pushSubscriptions = contact.Subscriptions();

                        if (pushSubscriptions == null || !pushSubscriptions.Subscriptions.Any())
                        {
                            Logger.Warn($"Can not unsubscribe the contact {contact.Id} due to the contact has no {nameof(PushSubscriptions)} facet.", this);
                            return;
                        }

                        if (!TryRemoveFromSubscriptions(pushSubscriptions, candidateToRemove, out string failuerReason))
                        {
                            Logger.Warn($"Can not remove the push subscription from the contact {contact.Id} due to '{failuerReason}'", this);
                            return;
                        }

                        // if there is no more subscriptions remove push notifications identifier
                        if (!pushSubscriptions.Subscriptions.Any())
                        {
                            RemovePushNotificationsIdentifier(client, contact);
                        }

                        SetContactFacet(client, contact, pushSubscriptions, PushSubscriptions.DefaultFacetKey);
                        Logger.Info($"The push subscription {candidateToRemove} was successfully removed from the contact [{contact.Id}]", this);
                    }
                }
            }
            catch (XdbExecutionException ex)
            {
                Logger.Error($"Updating contact: [{contact?.Id}] facet is failed. {ex.Message}", ex, this);
                throw new PushSubscriptionException($"Something goes wrong during removing push subscription.", candidateToRemove.Endpoint, candidateToRemove.Token, contact?.Id.ToString(), ex);
            }
        }

        /// <inheritdoc/>
        public void Remove(Dictionary<Guid, PushSubscription> contactSubscriptions)
        {
            foreach (var contactSubscription in contactSubscriptions)
            {
                try
                {
                    Remove(contactSubscription.Key, contactSubscription.Value);
                }
                catch (PushSubscriptionException ex)
                {
                    Logger.Error($"Can not remove push subscription Token [{ex.Token}], Endpoint [{ex.Endpoint}] from contact {ex.ContactId}", ex);
                }
            }
        }

        /// <inheritdoc/>
        public Dictionary<Guid, PushSubscription> Search(string token)
        {
            try
            {
                var contacts = new Dictionary<Guid, PushSubscription>();
                using (IXdbContext client = GetClient())
                {
                    IAsyncQueryable<Contact> queryable = client.Contacts
                    .Where(c => c.GetFacet<PushSubscriptions>().Subscriptions.Any(x => x.Value.Token == token))
                    .WithExpandOptions(new ContactExpandOptions(PushSubscriptions.DefaultFacetKey));

                    var enumerator = queryable.GetBatchEnumeratorSync();

                    Logger.Debug($"Finds {enumerator.TotalCount} contacts by {token}", this);
                    while (enumerator.MoveNext())
                    {
                        // Get first contact, because token is unique.
                        foreach (var contact in enumerator.Current)
                        {
                            var subscription = contact.Subscriptions()?.Subscriptions.Values.FirstOrDefault(x => x.Token == token);
                            contacts.Add(contact.Id.GetValueOrDefault(), subscription);
                        }
                    }
                }

                return contacts;
            }
            catch (Exception ex)
            {
                Logger.Error($"Searching contact by token is failed. {ex.Message}", ex, this);
            }

            return new Dictionary<Guid, PushSubscription>();
        }

        /// <summary>Tries to remove the push subscription from the subscriptions dictionary.</summary>
        /// <param name="pushSubscriptions">The push subscriptions.</param>
        /// <param name="pushSubscription">The push subscription.</param>
        /// <returns><see langword="True" /> if the push subscription was removed successfully.</returns>
        private bool TryRemoveFromSubscriptions(
          PushSubscriptions pushSubscriptions,
          PushSubscription pushSubscription,
          out string fauilerReason)
        {
            var findedSubscription = pushSubscriptions.Subscriptions
                               .FirstOrDefault(sub => sub.Value.Token == pushSubscription.Token && sub.Value.Endpoint == pushSubscription.Endpoint);

            fauilerReason = string.Empty;
            bool isRemoved = pushSubscriptions.Subscriptions.Remove(findedSubscription.Key);
            if (!isRemoved)
            {
                fauilerReason = $"The push subscription {pushSubscription} was not found in contact's push subscription list.";
                return false;
            }

            return true;
        }

        private void AddPushNotificationsIdentifier(IXdbContext client, Contact contact)
        {
            if (contact.Identifiers.Any(id => id.Source.Equals(Foundation.Analytics.Constants.Tracking.PushNotificationsSource)))
            {
                return;
            }

            client.AddContactIdentifier(contact, new ContactIdentifier(Foundation.Analytics.Constants.Tracking.PushNotificationsSource, Guid.NewGuid().ToString(), ContactIdentifierType.Known));
        }

        private void RemovePushNotificationsIdentifier(IXdbContext client, Contact contact)
        {
            var pushNotificationIdentifier = contact.Identifiers.FirstOrDefault(id => id.Source.Equals(Foundation.Analytics.Constants.Tracking.PushNotificationsSource));
            if (pushNotificationIdentifier == null)
            {
                return;
            }

            client.RemoveContactIdentifier(contact, pushNotificationIdentifier);
        }
    }
}