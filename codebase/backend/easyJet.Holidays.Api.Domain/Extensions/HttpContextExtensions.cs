using Microsoft.AspNetCore.Http;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Extensions
{
    /// <summary>
    /// HttpContext extension methods
    /// </summary>
    public static class HttpContextExtensions
    {
        /// <summary>
        /// Check whether http request is local or not (e.g. 127.0.0.1 or localhost)
        /// </summary>
        /// <param name="context">Http context</param>
        /// <returns>Whether request is local or not</returns>
        public static bool IsLocal(this HttpContext context)
        {
            var connection = context.Connection;

            if (connection.RemoteIpAddress == null && connection.LocalIpAddress == null)
            {
                return true;
            }

            if (connection.RemoteIpAddress.Equals(connection.LocalIpAddress))
            {
                return true;
            }

            if (IPAddress.IsLoopback(connection.RemoteIpAddress))
            {
                return true;
            }

            return false;
        }
    }
}
