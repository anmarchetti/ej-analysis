using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Providers;

namespace easyJet.Foundation.SitecoreExtensions.Cache.Repositories
{
    [Service(typeof(ICustomCacheRepository), Lifetime = Lifetime.Singleton)]
    public class CustomCacheRepository : BaseCacheRepository, ICustomCacheRepository
    {
        public override T GetItem<T>(string key)
        {
            return CustomCacheProvider.GetCacheObject<T>(key);
        }

        public override T StoreItem<T>(string key, T item, int expirationMinutes = 0)
        {
            return CustomCacheProvider.SetCacheObject<T>(key, item, expirationMinutes);
        }

        public override void RemoveItem(string key)
        {
            CustomCacheProvider.RemoveCacheObject(key);
        }
    }
}