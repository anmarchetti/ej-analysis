using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Google.Api.Services;
using easyJet.Holidays.External.Google.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Google.Services
{
    public class ReCAPTCHAService : ICaptchaService
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<ReCAPTCHAService> _logger;
        private readonly GoogleSettings _googleSettings;

        public ReCAPTCHAService(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            IOptions<GoogleSettings> googleSettings,
            ILogger<ReCAPTCHAService> logger
            )
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _googleSettings = googleSettings.Value ?? throw new ArgumentNullException(nameof(googleSettings));
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<bool> Verify(string token)
        {
            var request = new VerifyRequest();
            request.Response = token;
            request.Secret = _googleSettings.ReCAPTCHA.SecretKey;
            request.RemoteIP = _httpContextAccessor.HttpContext.Connection?.RemoteIpAddress?.ToString();
            request.SetQueryString();

            request.Endpoint = _endpointsProvider.GetEndpoint(GoogleEndpoint.ReCaptchaVerify, _httpContextAccessor.HttpContext.Request.Cookies);

            var response = await _apiService.GetResponseContentAsync<VerifyRequest, VerifyResponse>(request);


            return response?.Payload?.Body?.Success == true;
        }
    }
}
