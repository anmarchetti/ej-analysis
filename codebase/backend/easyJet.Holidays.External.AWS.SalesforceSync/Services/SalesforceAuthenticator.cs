using easyJet.Holidays.External.AWS.SalesforceSync.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Services
{
    /// <summary>
    /// Authenticates to Salesforce using JWT Bearer flow and retrieves OAuth access tokens.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class SalesforceAuthenticator : ISalesforceAuthenticator
    {
        private readonly string _privateKey;
        private readonly SalesforceConfiguration _config;

        /// <summary>
        /// Initializes a new instance of <see cref="SalesforceAuthenticator"/>.
        /// </summary>
        /// <param name="privateKey">Base64-encoded RSA private key for signing JWTs.</param>
        /// <param name="salesforceConfiguration">Salesforce connection and OAuth settings.</param>
        public SalesforceAuthenticator(string privateKey, IOptions<SalesforceConfiguration> salesforceConfiguration)
        {
            _privateKey = privateKey ?? throw new ArgumentNullException(nameof(privateKey));
            _config = salesforceConfiguration?.Value ?? throw new ArgumentNullException(nameof(salesforceConfiguration));
        }

        /// <inheritdoc/>
        public async Task<string> GetAccessTokenAsync()
        {
            string jwtToken = GenerateJwtToken();

            return await GetAccessTokenAsync(jwtToken);
        }

        private string GenerateJwtToken()
        {
            var now = DateTime.UtcNow;
            var exp = new DateTimeOffset(now.AddMinutes(15)).ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture);
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, _config.Username),
                new Claim(JwtRegisteredClaimNames.Iss, _config.ClientId),
                new Claim(JwtRegisteredClaimNames.Aud, _config.LoginUrl.ToString()),
                new Claim(JwtRegisteredClaimNames.Exp, exp)
            };

            byte[] privateKeyBytes = Convert.FromBase64String(_privateKey);
#pragma warning disable CA2000
            var privateKeyProvider = new RSACryptoServiceProvider(2048);
#pragma warning restore CA2000
            privateKeyProvider.ImportRSAPrivateKey(privateKeyBytes, out _);

            var token = new JwtSecurityToken(
                new JwtHeader(new SigningCredentials(new RsaSecurityKey(privateKeyProvider), SecurityAlgorithms.RsaSha256)),
                new JwtPayload(claims));

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<string> GetAccessTokenAsync(string jwtToken)
        {
            using HttpClient client = new();
#pragma warning disable CA2000
            var requestContent = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer"),
                new KeyValuePair<string, string>("assertion", jwtToken)
            });
#pragma warning restore CA2000

            var response = await client.PostAsync(new Uri($"{_config.LoginUrl}/services/oauth2/token"), requestContent);
            await EnsureSuccessStatusCodeAsync(response);
            var responseContent = await response.Content.ReadAsStringAsync();
            var accessTokenResponse = JsonConvert.DeserializeObject<AccessTokenResponse>(responseContent);

            return accessTokenResponse?.AccessToken!;
        }
        private static async Task EnsureSuccessStatusCodeAsync(HttpResponseMessage response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"{response.StatusCode} (ReasonPhrase: {response.ReasonPhrase}, Content: {responseContent})");
            }
        }

        /// <summary>
        /// Internal model for deserializing Salesforce OAuth token responses.
        /// </summary>
        [SuppressMessage("Usage", "CA1812:Avoid uninstantiated internal classes", Justification = "Instantiated by JSON serializer via reflection")]
        private sealed class AccessTokenResponse
        {
            [JsonProperty("access_token")]
            public string AccessToken { get; set; } = string.Empty;
            [JsonProperty("token_type")]
            public string TokenType { get; set; } = string.Empty;
            [JsonProperty("instance_url")]
            public string InstanceUrl { get; set; } = string.Empty;
            [JsonProperty("scope")]
            public string Scope { get; set; } = string.Empty;
        }
    }
}

