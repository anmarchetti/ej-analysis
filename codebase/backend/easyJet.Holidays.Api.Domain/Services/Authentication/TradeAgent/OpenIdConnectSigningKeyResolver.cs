using Microsoft.IdentityModel.Tokens;
using Polly;

#nullable enable

namespace easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent
{
    /// <summary>
    /// OpenIdConnect SigningKey Resolver
    /// </summary>
    public class OpenIdConnectSigningKeyResolver
    {
        private readonly string _authority;
        private readonly TimeSpan _keySetTimeToLive;
        private JsonWebKeySet? _keySet;
        private DateTime _keySetExpirationTime = DateTime.UtcNow;
        private readonly object _keySetLoadSync = new();

        /// <summary>
        /// .ctor
        /// </summary>
        /// <param name="authority"></param>
        /// <param name="keySetTimeToLive"></param>
        public OpenIdConnectSigningKeyResolver(string authority, TimeSpan keySetTimeToLive)
        {
            _authority = authority;
            _keySetTimeToLive = keySetTimeToLive;
        }

        /// <summary>
        /// Gets the signing keys
        /// </summary>
        /// <returns></returns>
        public IEnumerable<SecurityKey> GetSigningKeys()
        {
            if (_keySet == null || DateTime.UtcNow > _keySetExpirationTime)
            {
                lock (_keySetLoadSync)
                {
                    _keySet = LoadJsonWebKeySet();
                    _keySetExpirationTime += _keySetTimeToLive;
                }
            }

            return _keySet.GetSigningKeys();
        }

        private JsonWebKeySet LoadJsonWebKeySet()
        {
            var endpoint = $"{_authority}/protocol/openid-connect/certs";

            using var client = new HttpClient();

            var retry = Policy.Handle<HttpRequestException>().Retry(3);
            var json = retry.Execute(() => client.GetStringAsync(endpoint).Result);

            return new JsonWebKeySet(json);
        }
    }
}
