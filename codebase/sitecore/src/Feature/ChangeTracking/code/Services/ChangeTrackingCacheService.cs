using System;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore.Configuration;

namespace easyJet.Feature.ChangeTracking.Services
{
    [Service(typeof(ChangeTrackingCacheService), Lifetime = Lifetime.Singleton)]
    public class ChangeTrackingCacheService
    {
        public static readonly int CacheExpiredInMinutes = Settings.GetIntSetting(Constants.CacheExpiredInMinutesSettingName, 60);
        private readonly ICustomCacheRepository customCacheRepository;

        public ChangeTrackingCacheService(ICustomCacheRepository customCacheRepository)
        {
            this.customCacheRepository = customCacheRepository;
        }

        public virtual T GetCachedValue<T>(string key, Func<T> callback)
            where T : class
        {
            var cachedValue = customCacheRepository.GetItem<T>(key);
            if (cachedValue != null)
            {
                return cachedValue;
            }

            cachedValue = callback.Invoke();
            customCacheRepository.StoreItem(key, cachedValue, CacheExpiredInMinutes);
            return cachedValue;
        }
    }
}
