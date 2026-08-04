using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Sitecore.XConnect;

namespace easyJet.Foundation.XConnect.Common.Services
{
    public interface IXdbService
    {
        IXdbContext GetContext();

        Contact GetTargetContact(ContactReference contactReference, ContactExecutionOptions contactExecutionOptions, TimeSpan timeout);

        IAsyncQueryable<Contact> GetContactsQuery();

        Task<bool> BatchAddIdentifiers(Dictionary<Contact, ContactIdentifier[]> batch);
    }
}