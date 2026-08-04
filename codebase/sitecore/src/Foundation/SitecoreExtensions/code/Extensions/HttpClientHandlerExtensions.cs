using System.Net.Http;

namespace easyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class HttpClientHandlerExtensions
    {
        public static void DisableSslVerification(this HttpClientHandler handler)
        {
            handler.ClientCertificateOptions = ClientCertificateOption.Manual;
            handler.ServerCertificateCustomValidationCallback = (httpRequestMessage, cert, cetChain, policyErrors) => true;
        }
    }
}
