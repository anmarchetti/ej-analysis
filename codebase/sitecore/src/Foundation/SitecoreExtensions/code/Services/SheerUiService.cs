using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// Production implementation of ISheerUiService that delegates to Sitecore.Context.ClientPage and SheerResponse.
    /// </summary>
    [ExcludeFromCodeCoverage]
    [Service(typeof(ISheerUiService), Lifetime = Lifetime.Singleton)]
    public class SheerUiService : ISheerUiService
    {
        public bool IsEvent => Context.ClientPage.IsEvent;

        public void SetModified()
        {
            Context.ClientPage.Modified = true;
        }

        public void Start(object owner, string methodName, ClientPipelineArgs args)
        {
            Context.ClientPage.Start(owner, methodName, args);
        }

        public string GetClientEvent(string eventCommand)
        {
            return Context.ClientPage.GetClientEvent(eventCommand);
        }

        public void SetServerProperty(string key, string value)
        {
            Context.ClientPage.ServerProperties[key] = value;
        }

        public void Alert(string message)
        {
            SheerResponse.Alert(message);
        }

        public void ShowModalDialog(ModalDialogOptions options)
        {
            SheerResponse.ShowModalDialog(options);
        }

        public void SetAttribute(string controlId, string attributeName, string value)
        {
            Context.ClientPage.ClientResponse.SetAttribute(controlId, attributeName, value);
        }

        public void Eval(string script)
        {
            Context.ClientPage.ClientResponse.Eval(script);
        }
    }
}
