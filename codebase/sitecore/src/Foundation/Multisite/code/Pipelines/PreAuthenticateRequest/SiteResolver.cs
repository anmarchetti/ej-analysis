using Sitecore.Abstractions;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.HttpRequest;
using Sitecore.Sites;
using Sitecore.Web;

namespace easyJet.Foundation.Multisite.Pipelines.PreAuthenticateRequest
{
    public class SiteResolver : Sitecore.Pipelines.PreAuthenticateRequest.SiteResolver
    {
        private const string QuerySiteName = "sc_site";
        private const string HeaderSiteName = "X-ej-sc-site";

        public SiteResolver(BaseSiteContextFactory siteContextFactory, BaseSettings settings)
            : base(siteContextFactory, settings)
        {
        }

        /// <summary>
        /// Resolve site context.
        /// Order of site resolving:
        ///     1. By query string 'sc_site'
        ///     2. By header 'X-ej-sc-site'
        ///     3. If EnableSiteConfigFiles setting is enable resolve by site.config
        ///     4. By hostname.
        /// </summary>
        /// <param name="args">HttpRequestArgs arguments.</param>
        /// <returns>Resolved sitecore context.</returns>
        protected override SiteContext ResolveSiteContext(HttpRequestArgs args)
        {
            string queryString = GetQueryString(QuerySiteName, args);
            if (!string.IsNullOrWhiteSpace(queryString))
            {
                SiteContext siteContext = SiteContextFactory.GetSiteContext(queryString);
                Assert.IsNotNull(siteContext, $"Site from query string was not found: {queryString}");
                return siteContext;
            }

            var siteName = WebUtil.GetRequestHeader(HeaderSiteName);
            if (!string.IsNullOrWhiteSpace(siteName))
            {
                var siteContext = SiteContextFactory.GetSiteContext(siteName);
                Assert.IsNotNull(siteContext, $"Site from header was not found: {siteName}");
                return siteContext;
            }

            return base.ResolveSiteContext(args);
        }
    }
}
