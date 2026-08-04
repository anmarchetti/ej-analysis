using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Caching;
using easyJet.Feature.Redirects.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Globalization;

namespace easyJet.Feature.Redirects.Services
{
    [Service(typeof(IRedirectRuleMatcher), Lifetime = Lifetime.Singleton)]
    public class RedirectRuleMatcher : IRedirectRuleMatcher
    {
        private readonly IRedirectRuleRepository repository;

        private int CacheExpirationMinutes { get; }

        public RedirectRuleMatcher(IRedirectRuleRepository repository, BaseSettings settings)
        {
            this.repository = repository;
            CacheExpirationMinutes = settings.GetIntSetting("Redirect.RedirectMapResolver.CacheExpiration", 720);
        }

        public RedirectRuleMatchResult FindMatch(string url, Database database, ID templateId = null, Language language = null)
        {
            if (!TryNormalizeUrl(url, database, out var normalizedUrl, out var fullUrl, out var cacheUrlKey))
            {
                return null;
            }

            var resolved = GetResolvedMapping(database.Name, cacheUrlKey, templateId, language);
            if (resolved != null)
            {
                return resolved;
            }

            var cacheEntry = GetCache(database);
            if (!TryGetMatch(cacheEntry, normalizedUrl, fullUrl, templateId, language, out var matched, out var matchedUrl))
            {
                return null;
            }

            var result = BuildMatchResult(matched, matchedUrl);
            CacheResolvedMapping(database.Name, cacheUrlKey, templateId, language, result);
            return result;
        }

        public IReadOnlyCollection<RedirectRuleItem> GetRules(Database database)
        {
            var cacheEntry = GetCache(database);
            return cacheEntry?.Rules ?? Array.Empty<RedirectRuleItem>();
        }

        public void ClearCache()
        {
            RedirectRulesCache.ClearAll();
        }

        private static RedirectRuleCacheEntry BuildCache(IEnumerable<RedirectRuleItem> rules)
        {
            var ruleList = rules?.Where(rule => rule != null).ToList() ?? new List<RedirectRuleItem>();
            var exactMatches = new Dictionary<string, List<RedirectRuleEntry>>(StringComparer.OrdinalIgnoreCase);
            var patternMatches = new List<RedirectRuleEntry>();

            foreach (var rule in ruleList)
            {
                var normalized = RedirectRuleHelper.NormalizePattern(rule.FromUrl);
                rule.NormalizedFromUrl = normalized;
                rule.IsRegex = RedirectRuleHelper.IsRegexPattern(rule.FromUrl);
                rule.IsWildcard = RedirectRuleHelper.IsWildcardPattern(rule.FromUrl);

                if (!rule.IsWildcard && !rule.IsRegex)
                {
                    var exactEntry = new RedirectRuleEntry(rule, null);
                    if (!exactMatches.TryGetValue(normalized, out var entries))
                    {
                        entries = new List<RedirectRuleEntry>();
                        exactMatches[normalized] = entries;
                    }

                    entries.Add(exactEntry);
                    var prefixRegex = BuildPrefixRegex(normalized);
                    if (prefixRegex != null)
                    {
                        patternMatches.Add(new RedirectRuleEntry(rule, prefixRegex));
                    }

                    continue;
                }

                var regex = rule.IsRegex
                    ? BuildRegex(rule.FromUrl)
                    : RedirectRuleHelper.BuildWildcardRegex(rule.FromUrl);
                if (regex == null)
                {
                    continue;
                }

                patternMatches.Add(new RedirectRuleEntry(rule, regex));
            }

            var orderedPatterns = OrderEntries(patternMatches);
            var orderedExactMatches = exactMatches.ToDictionary(
                pair => pair.Key,
                pair => OrderEntries(pair.Value),
                StringComparer.OrdinalIgnoreCase);

            return new RedirectRuleCacheEntry(ruleList, orderedExactMatches, orderedPatterns);
        }

        private static RedirectRuleMatchResult GetResolvedMapping(string databaseName, string urlKey, ID templateId, Language language)
        {
            var key = BuildResolvedKey(urlKey, templateId, language);
            if (HttpRuntime.Cache[RedirectRulesCache.GetResolvedCacheKey(databaseName)] is Dictionary<string, RedirectRuleMatchResult> dictionary
                && dictionary.ContainsKey(key))
            {
                return dictionary[key];
            }

            return null;
        }

        private static void CacheResolvedMapping(string databaseName, string urlKey, ID templateId, Language language, RedirectRuleMatchResult match)
        {
            var cacheKey = RedirectRulesCache.GetResolvedCacheKey(databaseName);
            if (!(HttpRuntime.Cache[cacheKey] is Dictionary<string, RedirectRuleMatchResult> dictionary))
            {
                dictionary = new Dictionary<string, RedirectRuleMatchResult>(StringComparer.OrdinalIgnoreCase);
            }

            var key = BuildResolvedKey(urlKey, templateId, language);
            dictionary[key] = match;
            HttpRuntime.Cache.Add(cacheKey, dictionary, null, DateTime.UtcNow.AddMinutes(30), TimeSpan.Zero, CacheItemPriority.Normal, null);
        }

        private static string BuildResolvedKey(string urlKey, ID templateId, Language language)
        {
            var templateIdKey = templateId is null || templateId.IsNull ? string.Empty : templateId.ToString();
            var languageKey = language?.Name ?? string.Empty;
            return $"{urlKey}|{templateIdKey}|{languageKey}";
        }

        private static bool TryNormalizeUrl(string url, Database database, out string normalizedUrl, out string fullUrl, out string cacheUrlKey)
        {
            normalizedUrl = null;
            fullUrl = null;
            cacheUrlKey = null;

            if (string.IsNullOrWhiteSpace(url) || database == null)
            {
                return false;
            }

            normalizedUrl = RedirectRuleHelper.NormalizeUrl(url);
            if (string.IsNullOrWhiteSpace(normalizedUrl))
            {
                return false;
            }

            fullUrl = NormalizeFullUrl(url);
            cacheUrlKey = fullUrl ?? normalizedUrl;
            return true;
        }

        private static bool TryGetMatch(
            RedirectRuleCacheEntry cacheEntry,
            string normalizedUrl,
            string fullUrl,
            ID templateId,
            Language language,
            out RedirectRuleEntry matched,
            out string matchedUrl)
        {
            matched = null;
            matchedUrl = normalizedUrl;

            if (cacheEntry == null)
            {
                return false;
            }

            if (TryGetExactMatch(cacheEntry, normalizedUrl, templateId, language, out matched))
            {
                return true;
            }

            return TryGetPatternMatch(cacheEntry, normalizedUrl, fullUrl, templateId, language, out matched, out matchedUrl);
        }

        private static bool TryGetExactMatch(
            RedirectRuleCacheEntry cacheEntry,
            string normalizedUrl,
            ID templateId,
            Language language,
            out RedirectRuleEntry matched)
        {
            matched = null;
            if (!cacheEntry.ExactMatches.TryGetValue(normalizedUrl, out var exactMatches))
            {
                return false;
            }

            matched = exactMatches.FirstOrDefault(exactMatch => !ShouldSkipRule(exactMatch.Rule, templateId, language));
            return matched != null;
        }

        private static bool TryGetPatternMatch(
            RedirectRuleCacheEntry cacheEntry,
            string normalizedUrl,
            string fullUrl,
            ID templateId,
            Language language,
            out RedirectRuleEntry matched,
            out string matchedUrl)
        {
            matched = null;
            matchedUrl = normalizedUrl;
            foreach (var entry in cacheEntry.PatternMatches)
            {
                if (entry.Regex == null || ShouldSkipRule(entry.Rule, templateId, language))
                {
                    continue;
                }

                if (entry.Regex.IsMatch(normalizedUrl))
                {
                    matched = entry;
                    matchedUrl = normalizedUrl;
                    return true;
                }

                if (entry.Rule.IsRegex && !string.IsNullOrWhiteSpace(fullUrl) && entry.Regex.IsMatch(fullUrl))
                {
                    matched = entry;
                    matchedUrl = fullUrl;
                    return true;
                }
            }

            return false;
        }

        private static RedirectRuleMatchResult BuildMatchResult(RedirectRuleEntry matched, string matchedUrl)
        {
            if (matched?.Rule == null)
            {
                return null;
            }

            return new RedirectRuleMatchResult
            {
                Id = matched.Rule.Id,
                FromUrl = matched.Rule.FromUrl,
                ToUrl = ResolveTarget(matched, matchedUrl),
                RedirectType = matched.Rule.RedirectType,
                IsWildcard = matched.Rule.IsWildcard,
                Status = matched.Rule.Status,
                RelatedItemId = matched.Rule.RelatedItemId
            };
        }

        private static string NormalizeFullUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return null;
            }

            var trimmed = url.Trim();
            if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var absolute))
            {
                return null;
            }

            var full = absolute.GetLeftPart(UriPartial.Path).ToLowerInvariant();
            if (full.Length > 1 && full.EndsWith("/", StringComparison.Ordinal))
            {
                full = full.TrimEnd('/');
            }

            return full;
        }

        private static bool ShouldSkipRule(RedirectRuleItem rule, ID templateId, Language language)
        {
            if (rule == null)
            {
                return false;
            }

            var shouldSkip = false;

            if (!(templateId is null || templateId == ID.Null) && rule.FilterPageTypeIds != null && rule.FilterPageTypeIds.Count != 0)
            {
                shouldSkip = !rule.FilterPageTypeIds.Contains(templateId);
            }

            if (!shouldSkip && language != null && rule.LanguageNames != null && rule.LanguageNames.Count != 0)
            {
                shouldSkip = !rule.LanguageNames.Contains(language.Name);
            }

            return shouldSkip;
        }

        private static string ResolveTarget(RedirectRuleEntry entry, string url)
        {
            if (entry?.Rule == null || entry.Regex == null || !entry.Rule.IsRegex)
            {
                return entry?.Rule?.ToUrl;
            }

            var match = entry.Regex.Match(url);
            if (!match.Success)
            {
                return entry.Rule.ToUrl;
            }

            try
            {
                return match.Result(entry.Rule.ToUrl);
            }
            catch
            {
                return entry.Rule.ToUrl;
            }
        }

        private static Regex BuildRegex(string pattern)
        {
            if (string.IsNullOrWhiteSpace(pattern))
            {
                return null;
            }

            try
            {
                return new Regex(pattern.Trim(), RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
            }
            catch
            {
                return null;
            }
        }

        private static Regex BuildPrefixRegex(string normalizedPattern)
        {
            if (string.IsNullOrWhiteSpace(normalizedPattern) || string.Equals(normalizedPattern, "/", StringComparison.Ordinal))
            {
                return null;
            }

            var escaped = Regex.Escape(normalizedPattern);
            var pattern = ".*" + escaped + "(?=/|$)";
            return new Regex(pattern, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        }

        private static List<RedirectRuleEntry> OrderEntries(IEnumerable<RedirectRuleEntry> entries)
        {
            return entries
                .OrderByDescending(entry => entry.Rule.Priority)
                .ThenByDescending(entry => entry.SpecificityScore)
                .ThenBy(entry => entry.Rule.SortOrder)
                .ThenBy(entry => entry.Rule.Created)
                .ToList();
        }

        private RedirectRuleCacheEntry GetCache(Database database)
        {
            if (database == null)
            {
                return null;
            }

            var cacheKey = RedirectRulesCache.GetRulesCacheKey(database.Name);
            if (HttpRuntime.Cache[cacheKey] is RedirectRuleCacheEntry cached)
            {
                return cached;
            }

            var rules = repository.GetRules(database);
            var cacheEntry = BuildCache(rules);
            if (CacheExpirationMinutes > 0)
            {
                HttpRuntime.Cache.Add(cacheKey, cacheEntry, null, DateTime.UtcNow.AddMinutes(CacheExpirationMinutes), TimeSpan.Zero, CacheItemPriority.Normal, null);
            }
            else
            {
                HttpRuntime.Cache[cacheKey] = cacheEntry;
            }

            return cacheEntry;
        }

        private sealed class RedirectRuleCacheEntry
        {
            public RedirectRuleCacheEntry(
                IReadOnlyCollection<RedirectRuleItem> rules,
                Dictionary<string, List<RedirectRuleEntry>> exactMatches,
                List<RedirectRuleEntry> patternMatches)
            {
                Rules = rules;
                ExactMatches = exactMatches;
                PatternMatches = patternMatches;
            }

            public IReadOnlyCollection<RedirectRuleItem> Rules { get; }

            // Multiple exact rules can share the same URL and differ by languages.
            public Dictionary<string, List<RedirectRuleEntry>> ExactMatches { get; }

            public List<RedirectRuleEntry> PatternMatches { get; }
        }

        private sealed class RedirectRuleEntry
        {
            public RedirectRuleEntry(RedirectRuleItem rule, Regex regex)
            {
                Rule = rule;
                Regex = regex;
                SpecificityScore = RedirectRuleHelper.GetSpecificityScore(rule?.FromUrl);
            }

            public RedirectRuleItem Rule { get; }

            public Regex Regex { get; }

            public int SpecificityScore { get; }
        }
    }
}
