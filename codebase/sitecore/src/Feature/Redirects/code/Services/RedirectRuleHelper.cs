using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Feature.Redirects.Services
{
    internal static class RedirectRuleHelper
    {
        private static readonly string SegmentForExcluding = Sitecore.Configuration.Settings.GetSetting("Foundation.Presentation.ParentPagesUrlSegmentForExcluding");

        public static string[] SplitFilterPageTypes(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return Array.Empty<string>();
            }

            return value.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(part => part.Trim())
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        public static HashSet<ID> ParseFilterPageTypes(string value)
        {
            var result = new HashSet<ID>();
            foreach (var part in SplitFilterPageTypes(value))
            {
                if (ID.TryParse(part, out var id))
                {
                    result.Add(id);
                }
            }

            return result;
        }

        public static ImmutableHashSet<string> GetRuleLanguageNames(Item item, IReadOnlyDictionary<ID, string> languageNamesById)
        {
            if (languageNamesById == null || languageNamesById.Count == 0)
            {
                return ImmutableHashSet<string>.Empty;
            }

            return FieldUtils.GetMultilistTargetIds(Templates.RedirectRule.Fields.Languages, item)
                .Select(languageId => languageNamesById.TryGetValue(languageId, out var languageName) ? languageName : null)
                .Where(language => !string.IsNullOrWhiteSpace(language))
                .ToImmutableHashSet(StringComparer.OrdinalIgnoreCase);
        }

        public static string GetItemLanguages(string input, IReadOnlyDictionary<string, string> languageIdsByName)
        {
            if (string.IsNullOrWhiteSpace(input) || languageIdsByName == null || languageIdsByName.Count == 0)
            {
                return string.Empty;
            }

            var languageIds = input.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(part => part.Trim())
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(language => languageIdsByName.TryGetValue(language, out var languageId) ? languageId : null)
                .Where(languageId => !string.IsNullOrWhiteSpace(languageId))
                .Distinct(StringComparer.OrdinalIgnoreCase);

            return string.Join("|", languageIds);
        }

        public static ImmutableHashSet<string> ParseLanguageNames(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return ImmutableHashSet<string>.Empty;
            }

            return input.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(part => part.Trim())
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToImmutableHashSet(StringComparer.OrdinalIgnoreCase);
        }

        public static LanguageMaps BuildLanguageMaps(Database database)
        {
            var namesById = new Dictionary<ID, string>();
            var idsByName = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var root = database?.GetItem("/sitecore/system/Languages");
            if (root == null)
            {
                return new LanguageMaps(namesById, idsByName);
            }

            foreach (Item languageItem in root.Children)
            {
                if (string.IsNullOrWhiteSpace(languageItem.Name))
                {
                    continue;
                }

                var id = languageItem.ID.ToString();
                namesById[languageItem.ID] = languageItem.Name;
                idsByName[languageItem.Name] = id;
            }

            return new LanguageMaps(namesById, idsByName);
        }

        public static string NormalizeFilterPageTypes(string value)
        {
            return string.Join("|", SplitFilterPageTypes(value));
        }

        public static Models.RedirectRuleStatus ParseStatus(string value)
        {
            return Enum.TryParse(value?.Trim(), true, out Models.RedirectRuleStatus status)
                ? status
                : Models.RedirectRuleStatus.Active;
        }

        public static ID ParseRelatedItemId(string value)
        {
            return ID.TryParse(value?.Trim(), out var id) ? id : ID.Null;
        }

        public static bool IsSameUrl(string first, string second)
        {
            return string.Equals(NormalizeUrl(first), NormalizeUrl(second), StringComparison.OrdinalIgnoreCase);
        }

        public static string ToHotelRedirectRuleUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return string.Empty;
            }

            return StripParentPagesUrlSegment(NormalizeUrl(url));
        }

        public static string NormalizeUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return string.Empty;
            }

            var trimmed = url.Trim();
            if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absolute))
            {
                trimmed = absolute.AbsolutePath;
            }

            trimmed = HttpUtility.UrlDecode(trimmed);
            trimmed = SplitQuery(trimmed);
            trimmed = trimmed.Trim();
            trimmed = trimmed.ToLowerInvariant();

            if (!trimmed.StartsWith("/", StringComparison.Ordinal))
            {
                trimmed = "/" + trimmed;
            }

            if (trimmed.Length > 1 && trimmed.EndsWith("/", StringComparison.Ordinal))
            {
                trimmed = trimmed.TrimEnd('/');
            }

            return trimmed;
        }

        public static string NormalizePattern(string pattern)
        {
            if (string.IsNullOrWhiteSpace(pattern))
            {
                return string.Empty;
            }

            var trimmed = pattern.Trim();
            if (IsRegexPattern(trimmed))
            {
                return trimmed;
            }

            if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absolute))
            {
                trimmed = absolute.AbsolutePath;
            }

            trimmed = HttpUtility.UrlDecode(trimmed);
            trimmed = SplitQuery(trimmed);
            trimmed = trimmed.Trim();
            trimmed = trimmed.ToLowerInvariant();

            if (!trimmed.StartsWith("/", StringComparison.Ordinal) &&
                !trimmed.StartsWith("*", StringComparison.Ordinal) &&
                !trimmed.StartsWith("?", StringComparison.Ordinal))
            {
                trimmed = "/" + trimmed;
            }

            if (trimmed.Length > 1 && trimmed.EndsWith("/", StringComparison.Ordinal))
            {
                trimmed = trimmed.TrimEnd('/');
            }

            return trimmed;
        }

        public static bool IsWildcardPattern(string pattern)
            => !string.IsNullOrWhiteSpace(pattern)
                && !IsRegexPattern(pattern)
                && (pattern.Contains("*") || pattern.Contains("?"));

        public static bool IsRegexPattern(string pattern)
        {
            if (string.IsNullOrWhiteSpace(pattern))
            {
                return false;
            }

            var trimmed = pattern.Trim();
            return trimmed.StartsWith("^", StringComparison.Ordinal)
                || trimmed.EndsWith("$", StringComparison.Ordinal)
                || trimmed.Contains("(")
                || trimmed.Contains("[")
                || trimmed.Contains(".*")
                || trimmed.Contains(".+");
        }

        public static Regex BuildWildcardRegex(string pattern)
        {
            var normalized = NormalizePattern(pattern);
            var escaped = Regex.Escape(normalized);
            escaped = escaped.Replace("\\*", ".*").Replace("\\?", ".");
            return new Regex("^" + escaped + "$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        }

        public static int GetSpecificityScore(string pattern)
        {
            if (string.IsNullOrWhiteSpace(pattern))
            {
                return 0;
            }

            if (IsRegexPattern(pattern))
            {
                return pattern.Count(ch => char.IsLetterOrDigit(ch));
            }

            var normalized = NormalizePattern(pattern);
            return normalized.Count(ch => ch != '*' && ch != '?');
        }

        public static Language ResolveLanguageFromUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return null;
            }

            var segment = GetLeadingPathSegment(url);
            if (string.IsNullOrWhiteSpace(segment) || !LanguagePathMap.TryGetValue(segment, out var mappedLanguage))
            {
                return null;
            }

            return Language.Parse(mappedLanguage);
        }

        public static string GetLeadingPathSegment(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return string.Empty;
            }

            var input = url.Trim();
            string path;

            if (Uri.TryCreate(input, UriKind.Absolute, out var absolute))
            {
                path = absolute.AbsolutePath;
            }
            else
            {
                path = input;
                var queryStart = path.IndexOf('?');
                if (queryStart >= 0)
                {
                    path = path.Substring(0, queryStart);
                }

                var hashStart = path.IndexOf('#');
                if (hashStart >= 0)
                {
                    path = path.Substring(0, hashStart);
                }
            }

            if (string.IsNullOrWhiteSpace(path))
            {
                return string.Empty;
            }

            var parts = path.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            return parts.Length > 0 ? parts[0].Trim() : string.Empty;
        }

        private static string StripParentPagesUrlSegment(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return url;
            }

            var segment = SegmentForExcluding;
            if (string.IsNullOrWhiteSpace(segment))
            {
                return url;
            }

            var prefix = "/" + segment.Trim('/');
            if (!url.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return url;
            }

            return url.Length == prefix.Length
                ? "/"
                : url.Substring(prefix.Length);
        }

        private static string SplitQuery(string url)
        {
            var queryIndex = url.IndexOf("?", StringComparison.Ordinal);
            return queryIndex >= 0 ? url.Substring(0, queryIndex) : url;
        }

        private static readonly Dictionary<string, string> LanguagePathMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["en"] = "en",
            ["fr"] = "fr-FR",
            ["de"] = "de-DE",
            ["ch-fr"] = "fr-CH",
            ["ch-de"] = "de-CH",
            ["it"] = "it-IT",
            ["es"] = "es-ES",
            ["nl"] = "nl-NL"
        };
    }
}
