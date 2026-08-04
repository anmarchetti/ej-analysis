using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Sitecore.XConnect;

namespace easyJet.Foundation.Analytics.Services
{
    /// <summary>
    /// XConnect Contact Provider
    /// </summary>
    /// todo: refactor move all needed methods to ContactServiceExtended
    /// a lot of mixed logic here
    public interface IContactService
    {
        /// <summary>
        /// Trying get contact from xConnect.
        /// </summary>
        /// <param name="client">xConnect client.</param>
        /// <param name="contactId">Contact Id.</param>
        /// <returns>Current Contact.</returns>
        Contact EnsureContact(IXdbContext client, Guid? contactId = null);

        /// <summary>
        /// Trying get contact from xConnect.
        /// </summary>
        /// <param name="client">xConnect client.</param>
        /// <param name="facetKeys">Facet keys.</param>
        /// <param name="contactId">Contact Id.</param>
        /// <returns>Current Contact.</returns>
        Contact EnsureContact(IXdbContext client, string[] facetKeys, Guid? contactId = null);

        /// <summary>
        /// Get current contact identifier.
        /// </summary>
        /// <returns>Contact identifier.</returns>
        IdentifiedContactReference GetIdentifier();

        /// <summary>
        /// Get Contacts.
        /// </summary>
        /// <param name="client">XDb clients.</param>
        /// <param name="identifiers">Contact identifiers.</param>
        /// <param name="facetKeys">Facet keys.</param>
        /// <returns>Read only collection of xConnect contacts.</returns>
        Task<IReadOnlyCollection<Contact>> GetContacts(IXdbContext client, IReadOnlyCollection<string> identifiers, string[] facetKeys = null);

        /// <summary>
        /// Add identifier to current contact. If identifier exists on another contact performs merge.
        /// </summary>
        /// <param name="source">Source.</param>
        /// <param name="identifier">Identifier.</param>
        void AddIdentifierToCurrentContact(string source, string identifier);

        /// <summary>
        /// Remove contact data from shared session state - contact will be re-loaded.
        /// </summary>
        void RemoveContactFromSession();
    }
}