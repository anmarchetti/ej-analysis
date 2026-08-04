using System.Text.RegularExpressions;

namespace easyJet.Foundation.PushNotifications.Extensions
{
    public static class StringExtensions
    {
        /// <summary>
        /// Trim double quotes in provided string.
        /// </summary>
        /// <param name="source">Source string.</param>
        /// <param name="separator">Double quotes seporator.</param>
        /// <returns>Trimmed string.</returns>
        public static string TrimDoubleQuotes(this string source, string separator = "\"")
        {
            if (string.IsNullOrEmpty(source))
            {
                return string.Empty;
            }

            return source.Replace(separator, string.Empty);
        }
    }
}