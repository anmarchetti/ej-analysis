using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;

namespace easyJet.Holidays.Api.Domain.Extensions
{
    /// <summary>
    /// <see cref="IHeaderDictionary"/> extensions.
    /// </summary>
    public static class IHeaderDictionaryExtensions
    {
        /// <summary>
        /// Add cookie without encoding its value.
        /// </summary>
        /// <param name="headers">Headers dictionary</param>
        /// <param name="key">Cookie name</param>
        /// <param name="value">Cookie value</param>
        /// <param name="options">Cookie options</param>
        public static void AppendDecodedCookie(this IHeaderDictionary headers, string key, string value, CookieOptions options)
        {
            if (options == null)
            {
                throw new ArgumentNullException(nameof(options));
            }

            var setCookieHeaderValue = new SetCookieHeaderValue(
                Uri.EscapeDataString(key),
                value)
            {
                Domain = options.Domain,
                Path = options.Path,
                Expires = options.Expires,
                MaxAge = options.MaxAge,
                Secure = options.Secure,
                SameSite = (Microsoft.Net.Http.Headers.SameSiteMode)options.SameSite,
                HttpOnly = options.HttpOnly
            };

            var cookieValue = setCookieHeaderValue.ToString();

            headers.Append(HeaderNames.SetCookie, cookieValue);
        }
    }
}
