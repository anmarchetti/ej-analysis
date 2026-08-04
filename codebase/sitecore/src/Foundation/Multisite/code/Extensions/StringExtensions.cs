using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace easyJet.Foundation.Multisite.Extensions
{
    public static class StringExtensions
    {
        public static string EscapePath(this string path, bool escapeSpaces = true)
        {
            var strArray = path.Split('/');
            for (var index = 0; index < strArray.Length; ++index)
            {
                var input = strArray[index];
                if (input.Contains("$"))
                {
                    strArray[index] = input.ToLowerInvariant();
                }

                if (escapeSpaces && (input.Contains(" ") || input.Contains("-")) && !Regex.IsMatch(input, "\\[@@(.)*=.*\\]", RegexOptions.Compiled))
                {
                    strArray[index] = "#" + input.Trim('#') + "#";
                }
            }

            return strArray.DefaultIfEmpty(string.Empty).Aggregate((a, b) => a + "/" + b);
        }

        public static string ToWorkingQuery(this string query, bool escapeQueryKeyword = false)
        {
            return query.IndexOf("//", StringComparison.InvariantCulture) < 0
                   && query.IndexOf('[') < 0
                   && query.IndexOf('@') < 0
                   || query.ToLower().Contains("ancestor-or-self")
                   || query.ToLower().Contains("descendant-or-self")
                ? query
                : query.EscapePath();
        }

        public static string WithoutQueryKeyword(this string query)
        {
            return query.StartsWith("query:") ? query.Substring("query:".Length) : query;
        }
    }
}