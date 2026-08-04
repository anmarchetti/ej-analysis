using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading.Tasks;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.XConnect;
using Sitecore.XConnect.Client;
using Sitecore.XConnect.Client.Configuration;

namespace easyJet.Foundation.XConnect.Common.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IXdbService), Lifetime = Lifetime.Transient)]
    public class XdbService : IXdbService
    {
        private readonly IXdbContext context;

        public XdbService()
        {
            context = SitecoreXConnectClientConfiguration.GetClient();
        }

        public IXdbContext GetContext() => context;

        public Contact GetTargetContact(ContactReference contactReference, ContactExecutionOptions contactExecutionOptions, TimeSpan timeout) =>
            context.GetTargetContact(contactReference, contactExecutionOptions, timeout);

        public IAsyncQueryable<Contact> GetContactsQuery() => context.Contacts;

        public async Task<bool> BatchAddIdentifiers(Dictionary<Contact, ContactIdentifier[]> batch)
        {
            try
            {
                foreach (var contactIdentifiers in batch)
                {
                    foreach (var identifier in contactIdentifiers.Value)
                    {
                        context.AddContactIdentifier(contactIdentifiers.Key, identifier);
                    }
                }

                await context.SubmitAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}