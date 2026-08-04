using System.Web;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Sites;

namespace easyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class SiteExtensions
    {
        public static Item GetHomeItem(this SiteContext site)
        {
            Assert.IsNotNull(site, nameof(site));
            return site.Database.GetItem(site.StartPath);
        }

        public static string GetPagePreviewUrl(this Item item)
        {
            string previewUrl = string.Format(
                "{0}://{1}/?sc_itemid=%7b{2}%7d&sc_mode=preview&sc_lang={3}",
                HttpContext.Current.Request.Url.Scheme,
                HttpContext.Current.Request.Url.Host,
                item.ID.Guid.ToString().ToUpper(),
                item.Language);

            return previewUrl;
        }

        /// <summary>
        /// Gets current content database or current database if current content database equal null.
        /// </summary>
        /// <returns>Content database.</returns>
        public static Database GetContentDatabase()
        {
            return Context.ContentDatabase ?? Context.Database;
        }
    }
}