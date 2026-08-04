using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Domain.Models.Auth
{
    /// <summary>
    /// Model returned by api service after user authentication
    /// </summary>
    [Serializable]
    [DataContract]
    public class AuthToken : IAuthToken
    {
        /// <inheritdoc/>
        [DataMember(Name = "access_token")]
        public string AccessToken { get; set; }

        /// <inheritdoc/>
        [DataMember(Name = "expires_in")]
        public int ExpiresIn { get; set; }

        /// <summary>
        /// Token type (e.g. bearer)
        /// </summary>
        [DataMember(Name = "token_type")]
        public string TokenType { get; set; }

        /// <summary>
        /// User roles (null by default)
        /// </summary>
        [DataMember(Name = "scope")]
        public string Scope { get; set; }
    }
}
