using System.Net.Http.Headers;
using System.Text.RegularExpressions;

namespace easyJet.Holiday.IntegrationTests.Shared.Extensions
{
    public static class HttpResponseHeadersExtensions
    {
        /// <summary>
        /// Extract authentication cookies from the Orchestrator response for the /account/login call
        /// </summary>
        /// <param name="headers">Response headers</param>
        /// <returns>List of cookies in a format suitable for passing as request header (i.e. `key1=value1; key2=value2`)</returns>
        public static string GetAuthCookies(this HttpResponseHeaders headers)
        {
            var cookieHeader = headers.NonValidated["Set-Cookie"].ToString();

            // cookieHeader is just a dump os ALL new cookies, returned by the server
            // We need to extract custom auth cookies and transform them into valid key=value format for future use
            var regex = new Regex("((?:ej2|ejHol|ejTrade|ejExp).+?)=([^;]*);", RegexOptions.IgnoreCase);
            var ejCookieMatches = regex.Matches(cookieHeader);

            if (ejCookieMatches.Count == 0)
            {
                throw new ArgumentException("None of the expected headers were found");
            }

            var ejCookies = ejCookieMatches.Select(m => $"{m.Groups[1].Value}={m.Groups[2].Value}").ToList();

            var b2cCookieFound = 
                ejCookies.Any(c => c.StartsWith("eJ2Session", StringComparison.InvariantCulture));
            var tradePortalCookieFound =
                ejCookies.Any(c => c.StartsWith("eJTradePortalSession", StringComparison.InvariantCulture));
            
            if (!b2cCookieFound && !tradePortalCookieFound)
            {
                throw new ArgumentException("Session cookie was not found in the response");
            }
            
            return string.Join("; ", ejCookies);
        }
    }
}