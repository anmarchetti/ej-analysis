using System;
using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore.Configuration;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.SitecoreExtensions.Utils
{
    public class SecretsManagerCustomCache : CustomCacheRepository
    {
        public static readonly int CacheExpiredInMinutes = 24 * 60; // 24h

        static SecretsManagerCustomCache()
        {
            CacheExpiredInMinutes = Settings.GetIntSetting("AwsSecretsManager.CacheExpiredInMinutes", CacheExpiredInMinutes);
        }

        public Dictionary<string, string> GetCachedSecret(string secretId, Func<Dictionary<string, string>> callback)
        {
            var cachedValue = GetItem<Dictionary<string, string>>(secretId);
            if (cachedValue != null)
            {
                return cachedValue;
            }

            Log.Info($"Caching secrets for {nameof(secretId)}:{secretId}", this);
            cachedValue = callback.Invoke();
            StoreItem(secretId, cachedValue, CacheExpiredInMinutes);
            return cachedValue;
        }
    }
}
