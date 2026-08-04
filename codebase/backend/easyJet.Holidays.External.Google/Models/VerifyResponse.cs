using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Google.Models
{
    public class VerifyResponse : JsonApiResponse<VerifyResponseBody>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
    /// <summary>
    /// SmartSeer sorted offers response
    /// </summary>    
    [DataContract]
    public class VerifyResponseBody
    {
        /// <summary>
        /// Success
        /// </summary>
        [DataMember(Name = "success")]
        public bool Success { get; set; }

        /// <summary>
        /// timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
        /// </summary>
        [DataMember(Name = "challenge_ts")]
        public string ChallengeTs { get; set; }

        /// <summary>
        /// the package name of the app where the reCAPTCHA was solved
        /// </summary>
        [DataMember(Name = "apk_package_name")]
        public string ApkPackageName { get; set; }

        /// <summary>
        /// Errors
        /// </summary>
        [DataMember(Name = "error-codes")]
        public string[] ErrorCodes { get; set; }
    }
}
