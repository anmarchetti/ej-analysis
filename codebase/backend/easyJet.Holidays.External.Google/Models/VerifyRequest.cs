using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Google.Models
{
    public class VerifyRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Post;

        /// <summary>
        /// Required.The shared key between your site and reCAPTCHA. 
        /// </summary>
        [DataMember(Name = "secret")]
        public string Secret { get; set; }

        /// <summary>
        /// Required. The user response token provided by the reCAPTCHA client-side integration on your site.
        /// </summary>
        [DataMember(Name = "response")]
        public string Response { get; set; }

        /// <summary>
        /// Optional. The user's IP address.
        /// </summary>
        [DataMember(Name = "remoteip")]
        public string RemoteIP { get; set; }
    }
}