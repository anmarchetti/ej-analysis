using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Voucherify.Services
{
    /// <summary>
    /// Available endpoints
    /// </summary>
    public enum VoucherifyEndpoint
    {
        Customer,
        Customers,
        Voucher,
        Vouchers,
        VoucherPublish,
        ProcessRedemption,
        ValidateRedemption,
        RollBackRedemption,
        GetRedemptions,
        AddGiftBalance
    }

    /// <summary>
    /// Endpoints provider: takes valeues from appsettings
    /// </summary>
    public class EndpointsProvider : BaseEndpointsProvider
    {
        private readonly VoucherifySettings _settings;

        public EndpointsProvider(
            IOptions<VoucherifySettings> settings,
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<BaseEndpointsProvider> logger
            ) : base(envBehaviorSettings, cookiesService, logger)
        {
            _settings = settings.Value ?? throw new ArgumentNullException(nameof(settings));

            // Setup endpoints
            UriContainer[(int)VoucherifyEndpoint.Customer] = new EndpointUri(_settings.Host, _settings.Api.Customer);
            UriContainer[(int)VoucherifyEndpoint.Customers] = new EndpointUri(_settings.Host, _settings.Api.Customers);

            UriContainer[(int)VoucherifyEndpoint.Voucher] = new EndpointUri(_settings.Host, _settings.Api.Voucher);
            UriContainer[(int)VoucherifyEndpoint.Vouchers] = new EndpointUri(_settings.Host, _settings.Api.Vouchers);
            UriContainer[(int)VoucherifyEndpoint.VoucherPublish] = new EndpointUri(_settings.Host, _settings.Api.VoucherPublish);
            UriContainer[(int)VoucherifyEndpoint.GetRedemptions] = new EndpointUri(_settings.Host, _settings.Api.Redemptions);

            UriContainer[(int)VoucherifyEndpoint.ProcessRedemption] = new EndpointUri(_settings.Host, _settings.Api.ProcessRedemption);
            UriContainer[(int)VoucherifyEndpoint.ValidateRedemption] = new EndpointUri(_settings.Host, _settings.Api.ValidateRedemption);
            UriContainer[(int)VoucherifyEndpoint.RollBackRedemption] = new EndpointUri(_settings.Host, _settings.Api.RollBackRedemption);

            UriContainer[(int)VoucherifyEndpoint.AddGiftBalance] = new EndpointUri(_settings.Host, _settings.Api.AddGiftBalance);
        }

        /// <summary>
        /// Get atcom API endpoint. Uses mocked domain from cookies if it's allowed.
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="cookies">Collection of cookies</param>
        /// <returns>Endpoint Uri</returns>
        public Uri GetEndpoint(VoucherifyEndpoint type, IRequestCookieCollection cookies, Dictionary<string, string> urlSegments = null)
        {
            var endpoint = GetEndpoint((int)type, cookies, urlSegments);

            return endpoint;
        }

        /// <inheritdoc />
        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return CookiesService.VoucherifyMockCookie(cookies);
        }
    }
}
