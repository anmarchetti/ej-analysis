using easyJet.Holidays.External.Domain.Models.Auth;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Verint.Models
{
    public class OpenIdConnectAuthRequest : AuthRequest
    {
        [DataMember(Name = "grant_type")]
        public string GrantType { get; set; }

        [DataMember(Name = "username")]
        public string Username { get; set; }

        [DataMember(Name = "password")]
        public string Password { get; set; }

        [DataMember(Name = "client_id")]
        public string ClientId { get; set; }

        [DataMember(Name = "scope")]
        public string Scope { get; set; }
    }
}
