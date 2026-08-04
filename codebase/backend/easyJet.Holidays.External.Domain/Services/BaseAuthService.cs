using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Models.Auth;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.Domain.Services
{
    public abstract class BaseAuthService : IAuthService
    {
        private readonly IApiService _apiService;
        private readonly IAWSDbRepository<Token> _repository;
        private readonly ILogger<BaseAuthService> _logger;

        public BaseAuthService(
            IApiService apiService,
            IAWSDbRepository<Token> repository,
            ILogger<BaseAuthService> logger
        )
        {
            _apiService = apiService;
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Hash key as unique identifier of stored item
        /// </summary>
        public abstract string AuthKey { get; }

        /// <summary>
        /// Expiration time margin in seconds (use app settings value in overriden methods)
        /// </summary>
        public virtual int ExpirationTimeMargin => 5;

        /// <summary>
        /// Endpoint for getting new valid token
        /// </summary>
        public abstract Uri Endpoint { get; }

        /// <summary>
        /// ClientId for getting new valid token
        /// </summary>
        public abstract string ClientId { get; }

        /// <summary>
        /// ClientSecret for getting new valid token
        /// </summary>
        public abstract string ClientSecret { get; }

        /// <summary>
        /// GrantType for getting new valid token
        /// </summary>
        public abstract string GrantType { get; }

        /// <summary>
        /// Exception code for mapping error in case when getting new valid token is failed
        /// </summary>
        public abstract ExceptionCode AuthExceptionCode { get; }

        /// <inheritdoc />
        public virtual async Task<string> GetToken(bool forceUpdate = false)
        {
            if (!forceUpdate)
            {
                var cachedToken = await _repository.GetItemAsync(AuthKey);

                if (cachedToken != null && IsExpirationTimeValid(cachedToken))
                {
                    return cachedToken.AccessToken;
                }
            }

            var newToken = await GetNewToken();

            var gapedExpirationTime = GetExpirationTime(newToken.ExpiresIn);

            var dbItem = new Token
            {
                Key = AuthKey,
                AccessToken = newToken.AccessToken,
                ExpirationTime = gapedExpirationTime,
            };

            try
            {
                await _repository.SaveAsync(dbItem);
            }
            catch (Exception ex)
            {
                // when error we just log error message and let code go ahead without saving in db (it does not affect the returned result)
                _logger.LogWarning(ex, "Saving item in dynamo db is failed. Item: {Item}", JsonConvert.SerializeObject(dbItem));
            }

            return newToken.AccessToken;
        }

        /// <summary>
        /// External call to receive new valid access token
        /// </summary>
        /// <returns></returns>
        public virtual async Task<IAuthToken> GetNewToken()
        {
            var request = new AuthRequest
            {
                Endpoint = Endpoint
            };

            request.Payload.Body = new AuthRequestBody
            {
                ClientId = ClientId,
                ClientSecret = ClientSecret,
                GrantType = GrantType
            };

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<AuthRequest, AuthResponse>(
                    request, AuthExceptionCode);

            return response?.Payload?.Body;
        }

        /// <summary>
        /// Get expiration time considering expiration time margin
        /// </summary>
        /// <param name="expiresIn"></param>
        /// <returns></returns>
        protected virtual DateTime GetExpirationTime(int expiresIn)
        {
            return DateTime.UtcNow.AddSeconds(expiresIn - ExpirationTimeMargin);
        }

        /// <summary>
        /// Check whether cached token is not expired
        /// </summary>
        /// <param name="cachedToken"></param>
        /// <returns></returns>
        private bool IsExpirationTimeValid(Token cachedToken)
        {
            var now = DateTime.UtcNow;
            return cachedToken.ExpirationTime > now;
        }
    }
}
