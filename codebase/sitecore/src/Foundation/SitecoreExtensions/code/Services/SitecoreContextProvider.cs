using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore;
using Sitecore.Caching;
using Sitecore.Data.Items;
using Sitecore.Layouts;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(ISitecoreContextProvider), Lifetime = Lifetime.Singleton)]
    public class SitecoreContextProvider : ISitecoreContextProvider
    {
        /// <inheritdoc/>
        public Item Item => Context.Item;

        /// <inheritdoc/>
        public ItemsContext Items => Context.Items;

        /// <inheritdoc/>
        public PageContext Page => Context.Page;

        /// <inheritdoc/>
        public ClientPage ClientPage => Context.ClientPage;

        /// <inheritdoc/>
        public ClientResponse ClientResponse => ClientPage.ClientResponse;

        public bool IsClientPageEvent => Context.ClientPage?.IsEvent ?? false;

        public void StartClientPage(object owner, string methodName, ClientPipelineArgs args)
        {
            Context.ClientPage?.Start(owner, methodName, args);
        }

        public void SetClientPageModified(bool modified)
        {
            if (Context.ClientPage != null)
            {
                Context.ClientPage.Modified = modified;
            }
        }

        public string GetClientEvent(string eventCommand)
        {
            return Context.ClientPage?.GetClientEvent(eventCommand);
        }

        public void SetServerProperty(string key, string value)
        {
            if (Context.ClientPage != null)
            {
                Context.ClientPage.ServerProperties[key] = value;
            }
        }
    }
}