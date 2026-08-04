using easyJet.Feature.Redirects.Models;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Feature.Redirects.Services
{
    public interface IRedirectMapResolverService
    {
        /// <summary>
        /// Get Reditect data for the Sitecore Route Item.
        /// </summary>
        /// <param name="item">Sitecore Route Item.</param>
        /// <returns>Redirect Data.</returns>
        RedirectData GetRedirectData(Item item);

        /// <summary>
        /// Get Reditect data for the url.
        /// </summary>
        /// <param name="url">Page url</param>
        /// <param name="templateId">Page templateId</param>
        /// <param name="language">Context langauge</param>
        /// <returns>Redirect Data.</returns>
        RedirectData GetRedirectData(string url, ID templateId = null, Language language = null);
    }
}