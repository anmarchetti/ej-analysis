using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.EI.Services
{
    public enum PaymentEndpoint
    {
        MakePayment,
        CancelPayment,
        RefundPayment,
    }

    public class EndpointsProvider : BaseEndpointsProvider
    {
        private readonly PaymentsSettings _paymentsSettings;

        public EndpointsProvider(
          IOptions<PaymentsSettings> paymentSettings,
          IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
          ICookiesService cookiesService,
          ILogger<BaseEndpointsProvider> logger)
          : base(envBehaviorSettings, cookiesService, logger)
        {
            PaymentsSettings paymentsSettings = paymentSettings.Value ?? throw new ArgumentNullException(nameof(paymentSettings));
            _paymentsSettings = paymentsSettings;
            UriContainer[(int)PaymentEndpoint.MakePayment] = new EndpointUri(_paymentsSettings.MakePayment.Host, _paymentsSettings.MakePayment.Path);
            UriContainer[(int)PaymentEndpoint.CancelPayment] = new EndpointUri(_paymentsSettings.CancelPayment.Host, _paymentsSettings.CancelPayment.Path);
            UriContainer[(int)PaymentEndpoint.RefundPayment] = new EndpointUri(_paymentsSettings.RefundPayment.Host, _paymentsSettings.RefundPayment.Path);
        }

        public Uri GetEndpoint(PaymentEndpoint type, IRequestCookieCollection cookies)
        {
            return GetEndpoint((int)type, cookies);
        }

        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return CookiesService.PaymentMockCookie(cookies);
        }
    }
}
