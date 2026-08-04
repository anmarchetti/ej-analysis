using System;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Providers;

namespace easyJet.Foundation.SitecoreExtensions.Cache.Repositories
{
    /// <summary>
    /// Create caches.  Provide utility functions for finding and listing caches.
    /// </summary>
    [Service(typeof(IHtmlCacheRepository), Lifetime = Lifetime.Singleton)]
    public class HtmlCacheRepository : BaseCacheRepository, IHtmlCacheRepository
    {
        public override T GetItem<T>(string key)
        {
            return HtmlCacheProvider.GetFromSiteSpecificContext<T>(key);
        }

        public override T StoreItem<T>(string key, T item, int expirationMinutes = 0)
        {
            return HtmlCacheProvider.SetToSiteSpecificContext<T>(key, item, expirationMinutes);
        }

        public override void RemoveItem(string key)
        {
            HtmlCacheProvider.RemoveFromSiteSpecificContext(key);
        }
    }
}