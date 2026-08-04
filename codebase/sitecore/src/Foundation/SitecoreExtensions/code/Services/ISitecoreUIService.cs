using Sitecore.Web.UI.HtmlControls;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// Service contains method to work with Sitecore UI.
    /// </summary>
    public interface ISitecoreUIService
    {
        /// <summary>
        /// Shows the error dialog box to the user.
        /// </summary>
        /// <param name="shortDescription">The short description.</param>
        /// <param name="longDescription">The long description.</param>
        /// <remarks>
        /// This is currently implemented as an Alert box.
        /// </remarks>
        void SheerResponse_ShowError(string shortDescription, string longDescription);

        /// <summary>Shows a modal dialog to the user.</summary>
        /// <param name="url">The URL.</param>
        /// <param name="width">The width.</param>
        /// <param name="height">The height.</param>
        /// <param name="message">The message.</param>
        /// <param name="response">if set to <c>true</c> this instance is response.</param>
        /// <returns>Client Command.</returns>
        ClientCommand SheerResponse_ShowModalDialog(string url, string width, string height, string message, bool response);

        /// <summary>
        /// Sends a JavaScript eval command to the client.
        /// </summary>
        /// <param name="javascript">The javascript.</param>
        /// <remarks>
        /// The JavaScript statement are evaulated using the eval function.
        /// </remarks>
        void SheerResponse_Eval(string javascript);

        /// <summary>
        /// Alerts the specified text. Text is translated to show.
        /// </summary>
        /// <param name="text">The text.</param>
        /// <param name="arguments">The arguments.</param>
        void SheerResponse_Alert(string text, params string[] arguments);

        /// <summary>
        /// Displays an input box to the user.
        /// </summary>
        /// <param name="text">The text</param>
        /// <param name="defaultValue">The default value.</param>
        /// <remarks>If the user closes the box, the result is "null".</remarks>
        /// <returns>Client Command.</returns>
        ClientCommand SheerResponse_Input(string text, string defaultValue);

        /// <summary>
        /// Sends a message to the control hierachy.
        /// </summary>
        /// <param name="sender">The object that is sending the message.</param>
        /// <param name="message">The message.</param>
        /// <remarks>This message is first parsed into a Message object.</remarks>
        /// <returns>The Result property of the Message object.</returns>
        object ClientPage_SendMessage(object sender, string message);

        /// <summary>Shows the error dialog box to the user.</summary>
        /// <param name="shortDescription">The short description.</param>
        /// <param name="longDescription">The long description.</param>
        /// <returns>The Result property of the Error object.</returns>
        /// <remarks>This is currently implemented as an Alert box.</remarks>
        object ClientResponse_ShowError(string shortDescription, string longDescription);

        /// <summary>Sends an Alert command to the client.</summary>
        /// <param name="text">The text.</param>
        /// <returns>The Result property of the Alert object.</returns>
        object ClientResponse_Alert(string text);
    }
}
