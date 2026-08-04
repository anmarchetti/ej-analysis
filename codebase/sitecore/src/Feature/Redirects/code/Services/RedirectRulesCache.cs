using System.Collections;
using System.Linq;
using System.Web;

namespace easyJet.Feature.Redirects.Services
{
    internal static class RedirectRulesCache
    {
        private const string RulesCachePrefix = "easyJet-Redirect-Rules-";
        private const string ResolvedCachePrefix = "easyJet-Redirect-ResolvedMappings-";

        public static string GetRulesCacheKey(string databaseName) => $"{RulesCachePrefix}{databaseName}";

        public static string GetResolvedCacheKey(string databaseName) => $"{ResolvedCachePrefix}{databaseName}";

        public static void ClearAll()
        {
            var keys = HttpRuntime.Cache.Cast<DictionaryEntry>()
                .Select(entry => entry.Key as string)
                .Where(key => !string.IsNullOrWhiteSpace(key) &&
                    (key.StartsWith(RulesCachePrefix, System.StringComparison.OrdinalIgnoreCase) ||
                     key.StartsWith(ResolvedCachePrefix, System.StringComparison.OrdinalIgnoreCase)))
                .ToList();

            foreach (var key in keys)
            {
                HttpRuntime.Cache.Remove(key);
            }
        }
    }
}
