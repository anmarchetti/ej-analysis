using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.ApplePay.Api
{
    /// <summary>
    /// ApplePay API service
    /// </summary>
    public class ApplePayApiService : ApiService
    {
        private readonly ApplePaySettings _applePaySettings;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="apiClient">ApplePay Proxy Http client</param>
        /// <param name="applePaySettings">ApplePay Settings</param>
        /// <exception cref="ArgumentNullException"></exception>
        public ApplePayApiService(
            ApplePayApiClient apiClient,
            IOptions<PaymentMethodsSettings> applePaySettings
        ) : base(apiClient)
        {
            _applePaySettings = applePaySettings?.Value.ApplePay ??
                                throw new ArgumentNullException(nameof(applePaySettings));
        }

        /// <inheritdoc />
        public override string Name() => "ApplePay Proxy client.";

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _applePaySettings.Api.TimeoutMilliSeconds;
        }
    }
}
