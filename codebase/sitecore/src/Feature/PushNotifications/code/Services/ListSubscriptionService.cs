using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.PushNotifications.Exceptions;
using easyJet.Feature.PushNotifications.Logging;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Configuration;
using Sitecore.XConnect;
using Sitecore.XConnect.Collection.Model;

namespace easyJet.Feature.PushNotifications.Services
{
    /// <summary>
    /// List subscription service contains methods for working with list subscription facets.
    /// </summary>
    [Service(typeof(IListSubscriptionService), Lifetime = Lifetime.Singleton)]
    public class ListSubscriptionService : AnalyticsServiceBase, IListSubscriptionService
    {
        public ListSubscriptionService(IContactService contactService, IPushNotificationsLogger logger)
            : base(contactService, logger)
        {
            var subscriptionList = Settings.GetSetting("easyJet.Feature.PushNotifications.UnsubscriptionList");
            logger.Debug($"easyJet.Feature.PushNotifications.UnsubscriptionList: {subscriptionList}", this);

            UnsubscriptionListIds = subscriptionList.Split(',')
                .Select(id => Guid.TryParse(id, out var result) ? result : Guid.Empty)
                .Where(id => id != Guid.Empty);
        }

        /// <summary>
        /// Gets or sets the list of contact list Id's to unsubscribe.
        /// </summary>
        public IEnumerable<Guid> UnsubscriptionListIds { get; set; }

        /// <inheritdoc/>
        public void Unsubscribe(Guid contactId)
        {
            if (UnsubscriptionListIds == null || !UnsubscriptionListIds.Any())
            {
                Logger.Warn($"Can not unsubscribe contact {contactId} due to {nameof(UnsubscriptionListIds)} is null or empty.", this);
                return;
            }

            Contact contact = null;
            try
            {
                using (IXdbContext client = GetClient())
                {
                    contact = GetContactById(client, ListSubscriptions.DefaultFacetKey, contactId);

                    // If the contact cannot be resolved by ID. Get current tracker contact.
                    if (contact == null)
                    {
                        contact = GetCurrentTrackerContact(client, ListSubscriptions.DefaultFacetKey);
                    }

                    if (contact != null)
                    {
                        ListSubscriptions listSubscriptions = contact.ListSubscriptions();

                        if (listSubscriptions == null || listSubscriptions.Subscriptions == null)
                        {
                            Logger.Warn($"Can not unsubscribe the contact {contact.Id} due to the contact has no {nameof(ListSubscriptions)} facet.", this);
                            return;
                        }

                        foreach (Guid list in UnsubscriptionListIds)
                        {
                            if (!TryRemoveFromList(listSubscriptions, list, out string fauilerReason))
                            {
                                Logger.Warn($"Can not unsubscribe from the list subscription in the contact {contact.Id} due to '{fauilerReason}'", this);
                                return;
                            }
                        }

                        SetContactFacet(client, contact, listSubscriptions, ListSubscriptions.DefaultFacetKey);
                        Logger.Info($"The list subscription has been successfully removed from the contact [{contact.Id}]", this);
                    }
                }
            }
            catch (XdbExecutionException ex)
            {
                Logger.Error($"Updating contact facet is failed. {ex.Message}", ex, this);
                throw new ListSubscriptionException($"Can not update the contact's [{contact?.Id}] {nameof(ListSubscriptions)} facet.", ex);
            }
        }

        /// <inheritdoc/>
        public void Unsubscribe(IEnumerable<Guid> contactIds)
        {
            foreach (var contactId in contactIds)
            {
                try
                {
                    Unsubscribe(contactId);
                }
                catch (ListSubscriptionException ex)
                {
                    Logger.Error($"Can not remove contact [{contactId}] from subscription list: {ex.Message} ", ex);
                }
            }
        }

        /// <summary>Tries to remove the list from the subscriptions.</summary>
        /// <param name="listSubscriptions">The list subscriptions.</param>
        /// <param name="listId">The list Id.</param>
        /// <returns><see langword="True" /> if the list was removed successfully.</returns>
        private bool TryRemoveFromList(
          ListSubscriptions listSubscriptions,
          Guid listId,
          out string fauilerReason)
        {
            bool isRemoved = listSubscriptions.Subscriptions.Remove(listSubscriptions.Subscriptions.FirstOrDefault(x => x.ListDefinitionId == listId));
            fauilerReason = string.Empty;
            if (!isRemoved)
            {
                fauilerReason = $"The list [{listId}] was not found";
                return false;
            }

            return true;
        }
    }
}