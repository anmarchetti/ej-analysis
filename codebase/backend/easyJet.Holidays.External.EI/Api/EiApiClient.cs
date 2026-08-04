using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.EI.Api
{
    public class EiApiClient : BaseApiClient
    {
        private readonly PaymentsSettings _paymentSettings;
        private readonly ILogger<EiApiClient> _logger;

        public EiApiClient(HttpClient client, IOptions<PaymentsSettings> paymentSettings, IOptions<EnvironmentBehaviourSettings> envSettings, ILogger<EiApiClient> logger) : base(client, envSettings)
        {
            _paymentSettings = paymentSettings.Value ?? throw new ArgumentNullException(nameof(paymentSettings));
            _logger = logger;
        }

        public override string MediaType => "application/json";

        public override Task PrepareRequestMessage(HttpRequestMessage request)
        {
            var isRefundRequest = request.RequestUri.ToString().Contains(_paymentSettings.RefundPayment.Path);
            var xPosId = isRefundRequest ? _paymentSettings.XPosIdRefund : _paymentSettings.XPosId;
            _logger.LogInformation("Using X-POS-ID: {XPosId}", xPosId);

            request.Headers.Add("X-POS-ID", xPosId);
            request.Headers.Add("X-Client-Transaction-Id", Guid.NewGuid().ToString());
            request.Headers.Add("X-Inspection", _paymentSettings.XInspection);

            return base.PrepareRequestMessage(request);
        }

        public override Task ValidateResponse(HttpResponseMessage response, Stream content)
        {
            // not checking status code here - relying on code from response body instead     
            if (response.StatusCode == System.Net.HttpStatusCode.InternalServerError)
            {
                throw new HttpRequestException(response.ReasonPhrase);
            }

            return Task.CompletedTask;
        }
    }
}