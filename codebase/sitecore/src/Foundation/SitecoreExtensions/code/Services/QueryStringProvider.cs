using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Web;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// Provides access to query string parameters via WebUtil.
    /// </summary>
    [Service(typeof(IQueryStringProvider), Lifetime = Lifetime.Singleton)]
    public class QueryStringProvider : IQueryStringProvider
    {
        public string GetQueryString(string key)
        {
            return WebUtil.GetQueryString(key);
        }
    }
}
