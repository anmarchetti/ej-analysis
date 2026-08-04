using System;

namespace easyJet.Foundation.SitecoreExtensions.Cache
{
    public interface ISimpleCacheService
    {
        void RemoveItem(string key);

        T GetCachedValue<T>(string key, Func<T> callback)
            where T : class;
    }
}