using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils.Http;
using System.Net;

namespace easyJet.Holidays.External.Domain.Api.Client
{
    /// <summary>
    /// Client to sendXML requests
    /// </summary>
    public class ApiClientUtils
    {
        /// <summary>
        /// Configure Http handler with timeouts support.
        /// Ignores server certificates if it's configured in settings
        /// </summary>
        /// <param name="envSettings"></param>
        /// <returns></returns>
        public static HttpMessageHandler ConfigurePrimaryHttpMessageHandler(EnvironmentBehaviourSettings envSettings)
        {
            var httpClientHandler = new HttpClientHandler
            {
                AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
                MaxConnectionsPerServer = envSettings.MaxConnectionsPerServer
            };


            return new TimeoutHandler
            {
                InnerHandler = httpClientHandler
            };
        }
    }
}