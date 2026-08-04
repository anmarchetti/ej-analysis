using Sitecore;
using Sitecore.Configuration;

namespace easyJet.Foundation.SitecoreExtensions.Cache.Providers
{
    public static class CustomCacheProvider
    {
        public static readonly string CacheName = Settings.GetSetting("easyJet.CacheName", "easyJet.Cache");
        public static readonly string CacheSize = Settings.GetSetting("easyJet.CacheSize");
        public static readonly int CacheExpiredInMinutes = Settings.GetIntSetting("easyJet.CacheExpiredInMinutes", 60);

        private static readonly CustomСache Cache = new CustomСache(CacheName, StringUtil.ParseSizeString(CacheSize));

        public static T SetCacheObject<T>(string key, T value, int expirationMinutes = 0)
            where T : class
        {
            expirationMinutes = expirationMinutes > 0 ? expirationMinutes : CacheExpiredInMinutes;
            return Cache.SetCacheObject(key, value, expirationMinutes);
        }

        public static T GetCacheObject<T>(string key)
            where T : class
        {
            return Cache.GetCacheObject<T>(key);
        }

        public static void RemoveCacheObject(string key)
        {
            Cache.RemoveCacheObject(key);
        }

        public static void Clear() => Cache.Clear();
    }
}