using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Newtonsoft.Json;
using Sitecore.Analytics;
using Sitecore.Analytics.Model;
using Sitecore.Analytics.Tracking;
using Sitecore.Analytics.Tracking.Identification;
using Sitecore.Configuration;
using Sitecore.DependencyInjection;
using Sitecore.XConnect;
using Sitecore.XConnect.Client;
using Contact = Sitecore.XConnect.Contact;

[assembly: InternalsVisibleTo("easyJet.Foundation.Analytics.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Foundation.Analytics.Services
{
    /// <summary>
    /// The contact service.
    /// </summary>
    /// todo: refactor move all needed methods to ContactServiceExtended
    /// a lot of mixed logic here
    [Service(typeof(IContactService), Lifetime = Lifetime.Singleton)]
    public class ContactService : IContactService
    {
        private readonly IAnalyticsLogger logger;

        public ContactService(IAnalyticsLogger logger)
        {
            this.logger = logger;
        }

        /// <summary>
        /// Trying get contact from xConnect.
        /// </summary>
        /// <param name="client">xConnect client.</param>
        /// <param name="contactId">Contact Id.</param>
        /// <returns>Current Contact.</returns>
        public Contact EnsureContact(IXdbContext client, Guid? contactId = null)
            => EnsureContact(client, Array.Empty<string>(), contactId);

        /// <summary>
        /// Trying get contact from xConnect.
        /// </summary>
        /// <param name="client">xConnect client.</param>
        /// <param name="facetKeys">Facet keys.</param>
        /// <param name="contactId">Contact Id.</param>
        /// <returns>Current Contact.</returns>
        public Contact EnsureContact(IXdbContext client, string[] facetKeys, Guid? contactId = null)
        {
            var contactExecutionOptions = GetContactExecutionOptions(facetKeys);

            if (contactId != null && contactId.GetValueOrDefault() != Guid.Empty)
            {
                logger.Debug($"Resolve contact by contactId [{contactId}].", this);
                return client.Get(new ContactReference(contactId.Value), contactExecutionOptions);
            }

            var contact = client.Get(GetIdentifier(), contactExecutionOptions);
            if (contact == null)
            {
                logger.Debug($"Contact is null trying to save contact again", this);
                SaveContact();

                contact = client.Get(GetIdentifier(), contactExecutionOptions);
            }

            return contact;
        }

        /// <summary>
        /// Get current contact identifier.
        /// </summary>
        /// <returns>Contact identifier.</returns>
        public IdentifiedContactReference GetIdentifier()
        {
            if (Tracker.Current.Contact.IsNew || Tracker.Current.Contact.Identifiers.Count == 0)
            {
                logger.Debug($"Current DeviceProfileId [{Tracker.Current.Contact.ContactId}] is new or has no identifiers.", this);
                SaveContact();

                return new IdentifiedContactReference("xDB.Tracker", Tracker.Current.Contact.ContactId.ToString("N"));
            }

            logger.Debug($"Current DeviceProfileId [{Tracker.Current.Contact.ContactId}] is known.", this);
            var currentIdentifier = Tracker.Current.Contact.Identifiers.FirstOrDefault();

            logger.Debug($"Current identifier is [{JsonConvert.SerializeObject(currentIdentifier)}].", this);
            return new IdentifiedContactReference(currentIdentifier.Source, currentIdentifier.Identifier);
        }

        /// <summary>
        /// Get Contacts.
        /// </summary>
        /// <param name="client">XDb clients.</param>
        /// <param name="identifiers">Contact identifiers.</param>
        /// <param name="facetKeys">Facet keys.</param>
        /// <returns>Read only collection of xConnect contacts.</returns>
        public async Task<IReadOnlyCollection<Contact>> GetContacts(IXdbContext client, IReadOnlyCollection<string> identifiers, string[] facetKeys = null)
        {
            if (identifiers == null || !identifiers.Any())
            {
                return new List<Contact>();
            }

            var contactReferences = identifiers.Select(identifier => new IdentifiedContactReference(Constants.Tracking.DefaultIdentifierSource, identifier)).ToList();
            var contactExecutionOptions = GetContactExecutionOptions(facetKeys);

            var result = await client.GetAsync(contactReferences, contactExecutionOptions).ConfigureAwait(false);

            return result != null && result.Any()
                ? result.Where(lookupResult => lookupResult.Entity != null).Select(lookupResult => lookupResult.Entity).ToList()
                : new List<Contact>();
        }

        /// <summary>
        /// Remove contact data from shared session state - contact will be re-loaded.
        /// </summary>
        public void RemoveContactFromSession()
        {
            if (Tracker.Current?.Contact == null)
            {
                logger.Debug("Tracker.Current.Contact is null.", this);
                return;
            }

            var manager = GetContactManagerFromFactory();

            try
            {
                // Remove contact data from shared session state - contact will be re-loaded
                // during subsequent request with updated facets
                manager.RemoveFromSession(Tracker.Current.Contact.ContactId);
                Tracker.Current.Session.Contact = manager.LoadContact(Tracker.Current.Contact.ContactId);
                logger.Debug($"The contact (DeviceProfileId [{Tracker.Current?.Contact?.ContactId}]) was removed from session after facet was updated.", this);
            }
            catch (Exception ex)
            {
                logger.Error($"Cannot remove the contact (DeviceProfileId [{Tracker.Current?.Contact?.ContactId}]) from session due to {ex.Message}", ex, this);
            }
        }

        /// <summary>
        /// Add identifier to current contact. If identifier exists on another contact performs merge.
        /// </summary>
        /// <param name="source">Source.</param>
        /// <param name="identifier">Identifier.</param>
        public void AddIdentifierToCurrentContact(string source, string identifier)
        {
            if (IsIdentifierExistsOnCurrentContact(source, identifier))
            {
                return;
            }

            if (!(GetContactManagerFromFactory() is ContactManager manager))
            {
                logger.Error("Unable to retrieve ContactManager", this);
                return;
            }

            var existingContact = manager.LoadContact(source, identifier);

            if (Tracker.Current.Contact.IdentificationLevel != ContactIdentificationLevel.Known && existingContact == null)
            {
                if (!(ServiceLocator.ServiceProvider.GetService(typeof(IContactIdentificationManager)) is IContactIdentificationManager identificationManager))
                {
                    logger.Error("Could not retrieve identification Manager", this);
                    return;
                }

                identificationManager.IdentifyAs(new KnownContactIdentifier(source, identifier));
            }
            else
            {
                if (existingContact == null)
                {
                    var contactId = Tracker.Current.Session.Contact.ContactId;
                    manager.AddIdentifier(contactId, new KnownContactIdentifier(source, identifier));
                }
                else
                {
                    var currentContact = Tracker.Current.Session.Contact;
                    Tracker.Current.Session.Contact = manager.MergeContacts(existingContact, currentContact);
                }
            }

            RemoveContactFromSession();
        }

        internal virtual ContactManager GetContactManagerFromFactory()
        {
            return Factory.CreateObject("tracking/contactManager", true) as ContactManager;
        }

        /// <summary>
        /// Gets Contact Execution Options.
        /// </summary>
        /// <param name="facetKeys">Facet key.</param>
        /// <returns>Contact Execution Options.</returns>
        private static ContactExecutionOptions GetContactExecutionOptions(string[] facetKeys) =>
            facetKeys != null && facetKeys.Any() ?
                new ContactExecutionOptions(new ContactExpandOptions(facetKeys)) :
                new ContactExecutionOptions();

        /// <summary>
        /// Save Contact to xDB.
        /// </summary>
        private void SaveContact()
        {
            try
            {
                if (!Tracker.Current.Contact.IsNew)
                {
                    return;
                }

                if (!(GetContactManagerFromFactory() is ContactManager manager))
                {
                    return;
                }

                // Save contact to xConnect; at this point, a contact has an anonymous
                // TRACKER IDENTIFIER, which follows a specific format. Do not use the contactId overload
                // and make sure you set the ContactSaveMode as demonstrated
                Tracker.Current.Contact.ContactSaveMode = ContactSaveMode.AlwaysSave;
                manager.SaveContactToCollectionDb(Tracker.Current.Contact);

                logger.Debug($"Current DeviceProfileId [{Tracker.Current.Contact.ContactId}] was saved to CollectionDb.", this);
            }
            catch (Exception ex)
            {
                logger.Error($"Error Saving DeviceProfileId [{Tracker.Current.Contact.ContactId}]", ex, this);
            }
        }

        private bool IsIdentifierExistsOnCurrentContact(string source, string identifier)
        {
            if (string.IsNullOrEmpty(source) || string.IsNullOrEmpty(identifier))
            {
                throw new Exception("Source or Identifier was null");
            }

            if (Tracker.Current.Contact == null)
            {
                throw new Exception("No current tracker contact");
            }

            if (Tracker.Current.Contact.Identifiers.Any(x => x.Source == source && x.Identifier == identifier))
            {
                return true;
            }

            return false;
        }
    }
}