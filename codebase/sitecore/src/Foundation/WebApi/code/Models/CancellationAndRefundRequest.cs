using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Configuration;

namespace easyJet.Foundation.WebApi.Models
{
    /// <summary>
    /// Booking cancellation and refund request model.
    /// </summary>
    public class CancellationAndRefundRequest : BaseApiRequest
    {
        public CancellationAndRefundRequest()
        {
            Endpoint = Settings.GetSetting("WebApi.CancellationAndRefundEndpoint");
            Headers.Add("content-type", "application/json");
            Headers.Add("Authorization", SecretsManager.GetSecret("WebApi.ApiKey"));
        }
    }
}