using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Musement.Services
{
    /// <summary>
    /// Musement service for getting access token
    /// </summary>
    public class MusementAuthService : BaseAuthService
    {
        private readonly EndpointsProvider _musementEndpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly MusementSettings _musementSettings;

        public MusementAuthService(
            IApiService apiService,
            EndpointsProvider musementRequestBuilder,
            IHttpContextAccessor httpContextAccessor,
            IOptions<MusementSettings> musementSettings,
            IAWSDbRepository<Token> repository,
            ILogger<BaseAuthService> logger
        ) : base(apiService, repository, logger)
        {
            _musementEndpointsProvider = musementRequestBuilder;
            _httpContextAccessor = httpContextAccessor;
            _musementSettings = musementSettings.Value ?? throw new ArgumentNullException(nameof(musementSettings));
        }

        /// <inheritdoc/>
        public override string AuthKey => "MusementApi";

        /// <inheritdoc/>
        public override int ExpirationTimeMargin => _musementSettings.Credentials.ExpirationTimeMargin;

        /// <inheritdoc/>
        public override Uri Endpoint => _musementEndpointsProvider.GetEndpoint(MusementEndpoint.Login, _httpContextAccessor?.RequestCookies());

        /// <inheritdoc/>
        public override string ClientId => _musementSettings.Credentials.ClientId;

        /// <inheritdoc/>
        public override string ClientSecret => _musementSettings.Credentials.ClientSecret;

        /// <inheritdoc/>
        public override string GrantType => _musementSettings.Credentials.GrantType;

        /// <inheritdoc/>
        public override ExceptionCode AuthExceptionCode => ApiExceptionCodes.MusementAuthError;
    }
}
