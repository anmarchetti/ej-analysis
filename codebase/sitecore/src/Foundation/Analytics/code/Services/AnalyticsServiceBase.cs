using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using easyJet.Foundation.Analytics.Models;
using easyJet.Foundation.SitecoreExtensions.Logger;
using Sitecore.Analytics;
using Sitecore.Analytics.Model;
using Sitecore.Analytics.Tracking;
using Sitecore.XConnect;
using Sitecore.XConnect.Client;
using Sitecore.XConnect.Client.Configuration;
using Contact = Sitecore.XConnect.Contact;
using Interaction = Sitecore.XConnect.Interaction;

namespace easyJet.Foundation.Analytics.Services
{
    /// <summary>
    /// Base service for working with xDB facets and contacts.
    /// </summary>
    /// TODO: use IXConnectClient provider tor initializing IXdbContext
    /// TODO: segregate for a few smaller services
    public abstract class AnalyticsServiceBase
    {
        protected const int DefaultTimeOutMs = 2000;

        protected IContactService ContactService { get; }

        protected ILogger Logger { get; }

        protected AnalyticsServiceBase(
            IContactService contactService,
            ILogger logger)
        {
            ContactService = contactService;
            Logger = logger;
        }

        /// <summary>
        /// Get xconnect client.
        /// </summary>
        /// <returns>XConnect Client.</returns>
        public virtual IXdbContext GetClient()
        {
            return SitecoreXConnectClientConfiguration.GetClient();
        }

        /// <summary>
        /// Get current contact from tracker.
        /// </summary>
        /// <param name="client">xConnect client.</param>
        /// <param name="facetKey">Facet key.</param>
        /// <returns>Current Contact.</returns>
        public virtual Contact GetCurrentTrackerContact(IXdbContext client, string facetKey)
            => ContactService.EnsureContact(client, new[] { facetKey });

        /// <summary>
        /// Get current contact from tracker.
        /// </summary>
        /// <param name="client">xConnect client.</param>
        /// <param name="facetKeys">Facet keys.</param>
        /// <returns>Current Contact.</returns>
        public virtual Contact GetCurrentTrackerContact(IXdbContext client, params string[] facetKeys)
            => ContactService.EnsureContact(client, facetKeys);

        /// <summary>
        /// Get contact by ID from xConnect.
        /// </summary>
        /// <param name="client">xConnect client.</param>
        /// <param name="facetKey">Facet key.</param>
        /// <param name="contactId">Contact Id.</param>
        /// <returns>Current Contact.</returns>
        public virtual Contact GetContactById(IXdbContext client, string facetKey, Guid contactId)
        {
            if (contactId == Guid.Empty)
            {
                Logger.Debug($"Cannot resolve contact by ID: {contactId}", this);
                return null;
            }

            return client.Get(new ContactReference(contactId), new ContactExecutionOptions(new ContactExpandOptions(facetKey)));
        }

        /// <summary>
        /// Add identifier to current contact. If identifier exists on another contact performs merge.
        /// </summary>
        /// <param name="source">Source.</param>
        /// <param name="identifier">Identifier.</param>
        public virtual void AddIdentifierToCurrentContact(string source, string identifier)
            => ContactService.AddIdentifierToCurrentContact(source, identifier);

        /// <summary>
        /// Set facet to contact.
        /// </summary>
        /// <typeparam name="T">Facet Type.</typeparam>
        /// <param name="client">xDB client.</param>
        /// <param name="contact">Contact.</param>
        /// <param name="facet">Facet data.</param>
        /// <param name="facetKey">Facet key.</param>
        public virtual void SetContactFacet<T>(IXdbContext client, Contact contact, T facet, string facetKey)
            where T : Facet
        {
            client.SetFacet(contact, facetKey, facet);
            client.Submit();

            RemoveContactFromSession();
        }

        /// <summary>
        /// Add interaction with facet.
        /// </summary>
        /// <typeparam name="T">Facet type.</typeparam>
        /// <param name="client">xDB client.</param>
        /// <param name="contact">Contact.</param>
        /// <param name="interactionArgs">Interaction argements: Channel Id, User Agent, Page Event etc.</param>
        /// <param name="facet">Facet data.</param>
        /// <param name="facetKey">Facet key.</param>
        /// <returns>Task.</returns>
        public virtual async Task AddInteractionWithFacetAsync<T>(IXdbContext client, Contact contact, InteractionArgs interactionArgs, T facet, string facetKey)
            where T : Facet
        {
            var interaction = new Interaction(contact, InteractionInitiator.Contact, interactionArgs.ChannelId, interactionArgs.UserAgent);
            interaction.Events.Add(interactionArgs.PageEvent);

            client.SetFacet(interaction, facetKey, facet);
            client.AddInteraction(interaction);

            await client.SubmitAsync();

            RemoveContactFromSession();
        }

        /// <summary>
        /// Remove contact data from shared session state - contact will be re-loaded.
        /// </summary>
        protected void RemoveContactFromSession() => ContactService.RemoveContactFromSession();

        /// <summary>
        /// Save Contact to xDB.
        /// </summary>
        protected void SaveContact()
        {
            try
            {
                if (!Tracker.Current.Contact.IsNew)
                {
                    return;
                }

                if (!(Sitecore.Configuration.Factory.CreateObject("tracking/contactManager", true) is ContactManager manager))
                {
                    return;
                }

                // Save contact to xConnect; at this point, a contact has an anonymous
                // TRACKER IDENTIFIER, which follows a specific format. Do not use the contactId overload
                // and make sure you set the ContactSaveMode as demonstrated
                Tracker.Current.Contact.ContactSaveMode = ContactSaveMode.AlwaysSave;
                manager.SaveContactToCollectionDb(Tracker.Current.Contact);

                Logger.Debug($"The contact (DeviceProfileId [{Tracker.Current?.Contact?.ContactId}]) was saved to xDB.", this);
            }
            catch (Exception ex)
            {
                Logger.Error($"Cannot save the current contact (DeviceProfileId [{Tracker.Current?.Contact?.ContactId}]) to xDB due to {ex.Message}", ex, this);
            }
        }

        protected void AddIdentifiersToCurrentContact(string source, IEnumerable<string> identifiers)
        {
            foreach (var identifier in identifiers.Where(value => !string.IsNullOrEmpty(value)))
            {
                AddIdentifierToCurrentContact(source, identifier);
            }
        }

        /// <summary>
        /// Get current contact identifier.
        /// </summary>
        /// <returns>
        /// Contact identifier.
        /// </returns>
        protected IdentifiedContactReference GetIdentifier() => ContactService.GetIdentifier();
    }
}