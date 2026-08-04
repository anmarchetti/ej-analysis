using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Voucherify.Api
{
    public class VoucherifyApiService : ApiService
    {
        private readonly VoucherifySettings _settings;

        public VoucherifyApiService(VoucherifyApiClient apiClient, IOptions<VoucherifySettings> settings) : base(apiClient)
        {
            _settings = settings.Value ?? throw new ArgumentNullException(nameof(settings));
        }

        /// <inheritdoc />
        public override string Name() => "Voucherify API service.";

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _settings.TimeoutMilliSeconds;
        }

        public override Task<TResponse> GetResponseContentAsync<TRequest, TResponse>(TRequest request)
        {
            return base.GetResponseContentAsync<TRequest, TResponse>(request);
        }
    }
}