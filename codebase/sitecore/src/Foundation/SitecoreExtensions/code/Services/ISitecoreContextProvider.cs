using Sitecore.Caching;
using Sitecore.Data.Items;
using Sitecore.Layouts;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public interface ISitecoreContextProvider
    {
        /// <summary>
        /// Gets the Context Item
        /// </summary>
        /// <returns>Item object.</returns>
        Item Item { get; }

        /// <summary>
        /// Gets Items
        /// </summary>
        /// <returns>ItemsContext object.</returns>
        ItemsContext Items { get; }

        /// <summary>
        /// Gets PageContext
        /// </summary>
        /// <returns>PageContext object.</returns>
        PageContext Page { get; }

        /// <summary>
        /// Gets ClientPage
        /// </summary>
        /// <returns>ClientPage object.</returns>
        ClientPage ClientPage { get; }

        /// <summary>
        /// Gets ClientResponse
        /// </summary>
        /// <returns>ClientResponse object.</returns>
        ClientResponse ClientResponse { get; }

        bool IsClientPageEvent { get; }

        void StartClientPage(object owner, string methodName, ClientPipelineArgs args);

        void SetClientPageModified(bool modified);

        string GetClientEvent(string eventCommand);

        void SetServerProperty(string key, string value);
    }
}