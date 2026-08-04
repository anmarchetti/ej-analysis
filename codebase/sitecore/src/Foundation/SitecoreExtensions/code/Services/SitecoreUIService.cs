using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Web.UI.HtmlControls;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(ISitecoreUIService), Lifetime = Lifetime.Singleton)]
    public sealed class SitecoreUIService : ISitecoreUIService
    {
        private readonly ISitecoreContextProvider contextProvider;

        public SitecoreUIService(ISitecoreContextProvider contextProvider)
        {
            this.contextProvider = contextProvider;
        }

        /// <inheritdoc/>
        public void SheerResponse_ShowError(string shortDescription, string longDescription)
        {
            SheerResponse.ShowError(shortDescription, longDescription);
        }

        /// <inheritdoc/>
        public ClientCommand SheerResponse_ShowModalDialog(string url, string width, string height, string message, bool response)
        {
            return SheerResponse.ShowModalDialog(url, width, height, message, response);
        }

        /// <inheritdoc/>
        public void SheerResponse_Eval(string javascript)
        {
            SheerResponse.Eval(javascript);
        }

        /// <inheritdoc/>
        public void SheerResponse_Alert(string text, params string[] arguments)
        {
            SheerResponse.Alert(text, arguments);
        }

        /// <inheritdoc/>
        public ClientCommand SheerResponse_Input(string text, string defaultValue)
        {
            return SheerResponse.Input(text, defaultValue);
        }

        public object ClientPage_SendMessage(object sender, string message)
        {
            return contextProvider.ClientPage.SendMessage(sender, message);
        }

        public object ClientResponse_ShowError(string shortDescription, string longDescription)
        {
            return contextProvider.ClientResponse.ShowError(shortDescription, longDescription);
        }

        public object ClientResponse_Alert(string text)
        {
            return contextProvider.ClientResponse.Alert(text);
        }
    }
}