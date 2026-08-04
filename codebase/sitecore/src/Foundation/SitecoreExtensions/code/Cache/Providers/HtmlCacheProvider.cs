using System;
using Sitecore;

namespace easyJet.Foundation.SitecoreExtensions.Cache.Providers
{
    public static class HtmlCacheProvider
    {
        public static bool IsCacheEnabled()
        {
            return Context.Site != null && Context.Site.Caches.HtmlCache.Enabled;
        }

        public static T GetFromContext<T>(string name)
            where T : class
        {
            if (IsCacheEnabled())
            {
                var cache = Context.Site.Caches.HtmlCache.InnerCache;
                if (cache.ContainsKey(name))
                {
                    return cache[name] as T;
                }
            }

            return null;
        }

        public static T GetFromSiteSpecificContext<T>(string name, string language = null)
            where T : class
        {
            return GetFromContext<T>(GenerateSiteSpecificKey(name, language));
        }

        public static void RemoveFromSiteSpecificContext(string key, string language = null)
        {
            var cache = Context.Site.Caches.HtmlCache.InnerCache;
            cache.Remove(GenerateSiteSpecificKey(key, language));
        }

        public static T SetToContext<T>(string name, T value, int expirationMinutes = 0)
            where T : class
        {
            if (value == null)
            {
                return null;
            }

            if (IsCacheEnabled())
            {
                var cache = Context.Site.Caches.HtmlCache.InnerCache;

                // cache.Scavengable = true;
                if (cache.ContainsKey(name))
                {
                    cache.Remove(name);
                }

                if (expirationMinutes > 0)
                {
                    cache.Add(name, value, TimeSpan.FromMinutes(expirationMinutes));
                }
                else
                {
                    cache.Add(name, value);
                }
            }

            return value;
        }

        public static T SetToSiteSpecificContext<T>(string name, T value, int expirationMinutes = 0, string language = null)
            where T : class
        {
            return SetToContext(GenerateSiteSpecificKey(name, language), value, expirationMinutes);
        }

        private static string GenerateSiteSpecificKey(string name, string language = null)
        {
            return $"{name}_{Context.Site.Name}_{language ?? Context.Language.Name}";
        }
    }
}