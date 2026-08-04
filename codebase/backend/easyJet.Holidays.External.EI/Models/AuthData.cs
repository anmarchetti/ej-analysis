using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// This object contains information that is useful for 3DS transactions.
    /// </summary>
    [DataContract]
    public class AuthData
    {
        /// <summary>
        /// Status of the device data collection for 3DS2. (Applies to Web only)
        /// </summary>
        /// <value>Status of the device data collection for 3DS2. (Applies to Web only)</value>
        [DataMember(Name = "completionIndicator", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "completionIndicator")]
        public string CompletionIndicator { get; set; }

        /// <summary>
        /// Status of the 3DS2 challenge completion. This is the CRes.TransStatus. (Applies to Web and Mobile)
        /// </summary>
        /// <value>Status of the 3DS2 challenge completion. This is the CRes.TransStatus. (Applies to Web and Mobile)</value>
        [DataMember(Name = "transactionStatus", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "transactionStatus")]
        public string TransactionStatus { get; set; }

        /// <summary>
        /// The web page that will be displayed in the event of technical failure during 3DS2 in the banking domain. This must be an absolute URL.
        /// </summary>
        /// <value>The web page that will be displayed in the event of technical failure during 3DS2 in the banking domain. This must be an absolute URL.</value>
        [DataMember(Name = "customerServiceUrl", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "customerServiceUrl")]
        public string CustomerServiceUrl { get; set; }

        /// <summary>
        /// The endpoint that will receive challenge completion notification for 3DS2. This must be an absolute URL.
        /// </summary>
        /// <value>The endpoint that will receive challenge completion notification for 3DS2. This must be an absolute URL.</value>
        [DataMember(Name = "challengeNotificationUrl", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "challengeNotificationUrl")]
        public string ChallengeNotificationUrl { get; set; }

        /// <summary>
        /// Gets or Sets AppInfo
        /// </summary>
        [DataMember(Name = "appInfo", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "appInfo")]
        public AuthDataAppInfo AppInfo { get; set; }

        /// <summary>
        /// Gets or Sets MpiInfo
        /// </summary>
        [DataMember(Name = "mpiInfo", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "mpiInfo")]
        public AuthDataMpiInfo MpiInfo { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class AuthData {\n");
            sb.Append("  CompletionIndicator: ").Append(CompletionIndicator).Append("\n");
            sb.Append("  TransactionStatus: ").Append(TransactionStatus).Append("\n");
            sb.Append("  CustomerServiceUrl: ").Append(CustomerServiceUrl).Append("\n");
            sb.Append("  ChallengeNotificationUrl: ").Append(ChallengeNotificationUrl).Append("\n");
            sb.Append("  AppInfo: ").Append(AppInfo).Append("\n");
            sb.Append("  MpiInfo: ").Append(MpiInfo).Append("\n");
            sb.Append("}\n");
            return sb.ToString();
        }

        /// <summary>
        /// Get the JSON string presentation of the object
        /// </summary>
        /// <returns>JSON string presentation of the object</returns>
        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }

    }
}
