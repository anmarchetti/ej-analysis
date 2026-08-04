using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// Abstraction over Sitecore Sheer UI / ClientPage static calls to enable testing and decouple UI interactions.
    /// </summary>
    public interface ISheerUiService
    {
        /// <summary>
        /// Indicates whether the current request is a Sheer UI event (postback).
        /// </summary>
        bool IsEvent { get; }

        /// <summary>
        /// Marks the current ClientPage as modified.
        /// </summary>
        void SetModified();

        /// <summary>
        /// Starts a client pipeline process.
        /// </summary>
        /// <param name="owner">The owner object whose method will be invoked.</param>
        /// <param name="methodName">The method name to call on postback.</param>
        /// <param name="args">The client pipeline args.</param>
        void Start(object owner, string methodName, ClientPipelineArgs args);

        /// <summary>
        /// Builds a client event string for wiring up JS events to server-side handlers.
        /// </summary>
        string GetClientEvent(string eventCommand);

        /// <summary>
        /// Sets a server-side property on the ClientPage ServerProperties bag.
        /// </summary>
        void SetServerProperty(string key, string value);

        /// <summary>
        /// Shows a Sheer alert dialog.
        /// </summary>
        void Alert(string message);

        /// <summary>
        /// Shows a Sheer modal dialog with the provided options.
        /// </summary>
        void ShowModalDialog(ModalDialogOptions options);

        /// <summary>
        /// Sets an attribute on a control on the client.
        /// </summary>
        void SetAttribute(string controlId, string attributeName, string value);

        /// <summary>
        /// Executes arbitrary JavaScript on the client.
        /// </summary>
        void Eval(string script);
    }
}
