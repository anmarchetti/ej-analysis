using System;
using System.Diagnostics.CodeAnalysis;
using System.Net;
using Sitecore.Configuration;

namespace easyJet.Foundation.SitecoreExtensions.SystemNet
{
    [ExcludeFromCodeCoverage]
    /// <summary>
    /// Provides common methods for sending data to and receiving data from a resource identified by a URI.
    /// </summary>
    public class ExtendedWebClient : WebClient
    {
        /// <summary>
        /// Returns a System.Net.WebRequest object for the specified resource.
        /// Timeout is configured in SitecoreExtensions.WebRequestTimeout setting.
        /// </summary>
        /// <param name="uri">A System.Uri that identifies the resource to request.</param>
        /// <returns>A new System.Net.WebRequest object for the specified resource.</returns>
        protected override WebRequest GetWebRequest(Uri uri)
        {
            WebRequest webRequest = base.GetWebRequest(uri);
            webRequest.Timeout = Settings.GetIntSetting("SitecoreExtensions.WebRequestTimeout", 60000); // One minute by default
            return webRequest;
        }
    }
}