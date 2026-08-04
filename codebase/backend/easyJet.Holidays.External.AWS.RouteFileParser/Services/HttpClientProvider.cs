using System.Net;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Services
{
    internal class HttpClientProvider
    {
        public static HttpClient BuildHttpClient()
        {
            var httpClientHandler = new HttpClientHandler
            {
                AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
                CheckCertificateRevocationList = true
            };

            return new HttpClient(httpClientHandler);
        }
    }
}

