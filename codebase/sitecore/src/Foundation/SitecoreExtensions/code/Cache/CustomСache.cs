using System;

namespace easyJet.Foundation.SitecoreExtensions.Cache
{
    public class CustomСache : Sitecore.Caching.CustomCache
    {
        public CustomСache(string name, long maxSize)
            : base(name, maxSize)
        {
        }

        public T SetCacheObject<T>(string key, T value, int expirationMinutes = 0)
            where T : class
        {
            if (InnerCache.Enabled)
            {
                if (InnerCache.ContainsKey(key))
                {
                    InnerCache.Remove(key);
                }

                if (expirationMinutes > 0)
                {
                    InnerCache.Add(key, value, TimeSpan.FromMinutes(expirationMinutes));
                }
                else
                {
                    InnerCache.Add(key, value);
                }

                return value;
            }

            return null;
        }

        public T GetCacheObject<T>(string key)
            where T : class
        {
            if (InnerCache.Enabled)
            {
                if (!InnerCache.ContainsKey(key))
                {
                    return default(T);
                }

                return InnerCache.GetValue(key) as T;
            }

            return null;
        }

        public void RemoveCacheObject(string key)
        {
            if (InnerCache.Enabled)
            {
                InnerCache.Remove(key);
            }
        }
    }
}