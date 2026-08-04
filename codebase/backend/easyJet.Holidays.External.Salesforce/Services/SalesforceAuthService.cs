using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Models.Auth;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.External.Salesforce.Models.Auth;
using JWT;
using JWT.Algorithms;
using JWT.Serializers;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Security.Cryptography;

namespace easyJet.Holidays.External.Salesforce.Services
{
    public class SalesforceAuthService : BaseAuthService
    {
        private readonly SalesforceApiSettings _salesforceApiSettings;

        public SalesforceAuthService(
            IApiService apiService,
            IAWSDbRepository<Token> repository,
            ILogger<BaseAuthService> logger,
            IOptions<SalesforceApiSettings> salesforceApiSettings)
            : base(apiService, repository, logger)
        {
            _salesforceApiSettings = salesforceApiSettings.Value;
        }

        public override string AuthKey => "SalesforceAPI";
        public override Uri Endpoint => new Uri(_salesforceApiSettings.AuthEndpoint);
        public override string ClientId => _salesforceApiSettings.ClientId;
        public override string ClientSecret => throw new NotImplementedException();
        public override string GrantType => "client_credentials";
        public override ExceptionCode AuthExceptionCode { get; }

        public override async Task<IAuthToken> GetNewToken()
        {
            string jwtToken = GenerateJwtToken();
            string accessToken = await GetAccessToken(jwtToken);
            return new AuthToken() { AccessToken = accessToken, ExpiresIn = _salesforceApiSettings.JwtAuthTokenLifetime };
        }

        private string GenerateJwtToken()
        {
            var tokenExpiration = DateTimeOffset.UtcNow.AddSeconds(_salesforceApiSettings.JwtAuthTokenLifetime).ToUnixTimeSeconds();

            var jwtPayload = new JwtPayload
            {
                Aud = _salesforceApiSettings.AuthEndpoint,
                Exp = tokenExpiration.ToString(),
                Iss = ClientId,
                Sub = _salesforceApiSettings.UserName
            };

            var privateKey = RSA.Create();
            privateKey.ImportFromPem(Base64Helper.Decode(_salesforceApiSettings.JwtAuthPrivateKey));

            var publicKey = RSA.Create();
            publicKey.ImportFromPem(Base64Helper.Decode(_salesforceApiSettings.JwtAuthPublicKey));

            var algorithm = new RS256Algorithm(publicKey, privateKey);
            var serializer = new JsonNetSerializer();
            var urlEncoder = new JwtBase64UrlEncoder();
            var jwtEncoder = new JwtEncoder(algorithm, serializer, urlEncoder);

            var token = jwtEncoder.Encode(jwtPayload, privateKey.ExportRSAPrivateKey());
            return token;
        }

        private async Task<string> GetAccessToken(string jwtToken)
        {
            using (var client = new HttpClient())
            {
                var requestContent = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer"),
                    new KeyValuePair<string, string>("assertion", jwtToken)
                });

                var response = await client.PostAsync($"{Endpoint}", requestContent);
                var responseContent = await response.Content.ReadAsStringAsync();
                var accessTokenResponse = JsonConvert.DeserializeObject<AccessTokenResponse>(responseContent);

                return accessTokenResponse.Access_token;
            }
        }
    }
}
