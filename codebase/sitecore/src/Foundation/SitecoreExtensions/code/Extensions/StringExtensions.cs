using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;

namespace EasyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class StringExtensions
    {
        public static string ToSha1Hash(this string input)
        {
            using (var sha1 = SHA1.Create())
            {
                var inputBytes = Encoding.UTF8.GetBytes(input);
                var hashBytes = sha1.ComputeHash(inputBytes);

                var sb = new StringBuilder();
                foreach (var t in hashBytes)
                {
                    sb.Append(t.ToString("x2"));
                }

                return sb.ToString();
            }
        }

        /// <summary>
        /// Strips all html tags, which are not in allowed tags
        /// </summary>
        /// <param name="html">html source</param>
        /// <param name="allowedTags">tags to keep</param>
        /// <returns>stripped html</returns>
        public static string StripHtml(this string html, params string[] allowedTags)
        {
            if (string.IsNullOrWhiteSpace(html))
            {
                return html;
            }

            if (allowedTags == null)
            {
                allowedTags = Array.Empty<string>();
            }

            string pattern;
            if (allowedTags.Any())
            {
                pattern = "<(?!/?(" + string.Join("|", allowedTags) + ")\\b)[^>]*>";
            }
            else
            {
                pattern = "<[^>]*>";
            }

            var regex = new Regex(pattern, RegexOptions.IgnoreCase);
            var cleanedHtml = regex.Replace(html, string.Empty);

            return cleanedHtml;
        }

        /// <summary>
        /// Separate string by separator char.
        /// By default separator is '|'.
        /// </summary>
        /// <param name="source">Source string.</param>
        /// <param name="separator">Separator char.</param>
        /// <returns>Separated string.</returns>
        public static string[] Separate(this string source, char separator = '|')
        {
            return source?.Split(separator) ?? new string[0];
        }

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

        /// <summary>
        /// Remove extra spaces in provided string.
        /// </summary>
        /// <param name="source">Source string.</param>
        /// <returns>Single space string.</returns>
        public static string RemoveExtraSpaces(this string source)
        {
            if (string.IsNullOrEmpty(source))
            {
                return string.Empty;
            }

            return Regex.Replace(source, @"\s+", " ");
        }

        public static string ToWildcard(this string input) => !string.IsNullOrWhiteSpace(input) ? $"*{input}*" : null;

        public static bool Is(this string first, string second) => string.Equals(first, second, StringComparison.Ordinal);

        public static string ToGzipedString(this string value)
        {
            using (var memoryStream = value.ToGzipMemoryStream())
            {
                return Convert.ToBase64String(memoryStream.ToArray());
            }
        }

        public static bool TryParseJson<T>(this string json, out T result)
            where T : class
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                result = default(T);
                return false;
            }

            var success = true;
            var settings = new JsonSerializerSettings
            {
                Error = (sender, args) =>
                {
                    success = false;
                    args.ErrorContext.Handled = true;
                },
                MissingMemberHandling = MissingMemberHandling.Error
            };

            result = JsonConvert.DeserializeObject<T>(json, settings);
            if (!success)
            {
                result = default(T);
            }

            return success;
        }

        /// <summary>
        /// Converts a Code to an ATCOM identifier.
        /// </summary>
        /// <remarks>
        /// The resulting string starts with the provided <paramref name="perfix"/> and is
        /// the prefix followed by seven alphanumeric characters.
        /// If the GIATA code is less than seven characters, additional zeroes are inserted
        /// between the <paramref name="perfix"/> and the GIATA code.
        /// If the GIATA code is more than seven characters, leading characters are removed
        /// so that only the last seven characters are used.
        /// </remarks>
        /// <param name="code">The GIATA code to convert.</param>
        /// <param name="perfix">The prefix to prepend to the formatted GIATA code.</param>
        /// <returns>
        /// The formatted ATCOM identifier.
        /// For example, when <paramref name="perfix"/> is <c>W</c>:
        /// <c>1502000</c> becomes <c>W1502000</c>,
        /// <c>123</c> becomes <c>W0000123</c>,
        /// and <c>12345678</c> becomes <c>W2345678</c>.
        /// </returns>
        /// <exception cref="ArgumentException">
        /// Thrown when <paramref name="code"/> is null, empty, or whitespace.
        /// </exception>
        public static string ToAtcomId(this string code, string perfix)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                throw new ArgumentException("Code is required.", "code");
            }

            if (string.IsNullOrWhiteSpace(perfix))
            {
                throw new ArgumentException("Prefix is required.", "perfix");
            }

            code = code.Trim();
            perfix = perfix.Trim();

            var formattedGiataCode = code.Length > 7
                ? code.Substring(code.Length - 7)
                : code.PadLeft(7, '0');

            return string.Format("{0}{1}", perfix, formattedGiataCode);
        }

        private static MemoryStream ToGzipMemoryStream(this string value)
        {
            var output = new MemoryStream();
            using (var zipStream = new GZipStream(output, CompressionMode.Compress, true))
            using (var writer = new StreamWriter(zipStream))
            {
                writer.Write(value);
                writer.Flush();
                zipStream.Flush();
            }

            output.Position = 0;  // Reset position to the beginning
            return output;
        }
    }
}