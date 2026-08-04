using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Domain.Models.Auth
{
    /// <summary>
    /// Common credential model
    /// </summary>
    [Serializable]
    [DataContract]
    public class AuthRequestBody
    {
        /// <summary>
        /// Client Id
        /// </summary>
        [DataMember(Name = "client_id")]
        public string ClientId { get; set; }

        /// <summary>
        /// Client secret
        /// </summary>
        [DataMember(Name = "client_secret")]
        public string ClientSecret { get; set; }

        /// <summary>
        /// Grant type
        /// </summary>
        [DataMember(Name = "grant_type")]
        public string GrantType { get; set; }
    }
}
