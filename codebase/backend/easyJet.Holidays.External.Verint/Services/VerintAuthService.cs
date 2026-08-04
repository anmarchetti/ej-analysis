using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Models.Auth;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.External.Verint.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Verint.Services
{
    public class VerintAuthService : BaseAuthService
    {
        private readonly IApiService _apiService;
        private readonly IAWSDbRepository<Token> _repository;
        private readonly ILogger<BaseAuthService> _logger;
        private readonly VerintApiSettings _verintApiSettings;

        public VerintAuthService(IApiService apiService, IAWSDbRepository<Token> repository, ILogger<BaseAuthService> logger, IOptions<VerintApiSettings> verintApiSettings) : base(apiService, repository, logger)
        {
            _apiService = apiService;
            _repository = repository;
            _logger = logger;
            _verintApiSettings = verintApiSettings?.Value ?? throw new ArgumentNullException(nameof(verintApiSettings));
        }

        public string UserName => _verintApiSettings.UserName;
        public string Password => _verintApiSettings.Password;
        public string Scope => _verintApiSettings.Scope;
        public override string AuthKey => _verintApiSettings.AuthKey;
        public override Uri Endpoint => new Uri(Utils.ReplaceClientId(_verintApiSettings.AuthEndPoint, ClientId));
        public override string ClientId => _verintApiSettings.ClientId;
        public override string ClientSecret => null;
        public override string GrantType => _verintApiSettings.GrantType;
        public override ExceptionCode AuthExceptionCode { get; }

        /// <summary>
        /// External call to receive new valid access token
        /// </summary>
        /// <returns></returns>
        public override async Task<IAuthToken> GetNewToken()
        {
            var request = new OpenIdConnectAuthRequest()
            {
                Endpoint = Endpoint,
                ClientId = ClientId,
                GrantType = GrantType,
                Password = Password,
                Scope = Scope,
                Username = UserName
            };

            request.SetQueryString();
            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<AuthRequest, AuthResponse>(
                request, AuthExceptionCode);

            return response?.Payload?.Body;
        }

        protected override DateTime GetExpirationTime(int expiresIn)
        {
            var dateTimeOffset = DateTimeOffset.FromUnixTimeSeconds(expiresIn);
            return dateTimeOffset.UtcDateTime.AddSeconds(ExpirationTimeMargin * -1);
        }
    }
}
