using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// Contains information that is collected as part of Mobile device data capture for 3DS2
    /// </summary>
    [DataContract]
    public class AuthDataAppInfo
    {
        /// <summary>
        /// Unique application identifier obtained from 3DS2 SDK.
        /// </summary>
        /// <value>Unique application identifier obtained from 3DS2 SDK.</value>
        [DataMember(Name = "appId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "appId")]
        public string AppId { get; set; }

        /// <summary>
        /// Encrypted data from 3DS2 SDK.
        /// </summary>
        /// <value>Encrypted data from 3DS2 SDK.</value>
        [DataMember(Name = "encData", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "encData")]
        public string EncData { get; set; }

        /// <summary>
        /// Elliptic curve data from 3DS2 SDK
        /// </summary>
        /// <value>Elliptic curve data from 3DS2 SDK</value>
        [DataMember(Name = "crv", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "crv")]
        public string Crv { get; set; }

        /// <summary>
        /// Elliptic curve data from 3DS2 SDK
        /// </summary>
        /// <value>Elliptic curve data from 3DS2 SDK</value>
        [DataMember(Name = "kty", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "kty")]
        public string Kty { get; set; }

        /// <summary>
        /// Elliptic curve data from 3DS2 SDK.
        /// </summary>
        /// <value>Elliptic curve data from 3DS2 SDK.</value>
        [DataMember(Name = "xv", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "xv")]
        public string Xv { get; set; }

        /// <summary>
        /// Elliptic curve data from 3DS2 SDK.
        /// </summary>
        /// <value>Elliptic curve data from 3DS2 SDK.</value>
        [DataMember(Name = "yv", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "yv")]
        public string Yv { get; set; }

        /// <summary>
        /// Maximum timeout in minutes for a 3DS2 session in the Mobile app.
        /// </summary>
        /// <value>Maximum timeout in minutes for a 3DS2 session in the Mobile app.</value>
        [DataMember(Name = "maximumTimeout", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "maximumTimeout")]
        public int? MaximumTimeout { get; set; }

        /// <summary>
        /// SDK reference number.
        /// </summary>
        /// <value>SDK reference number.</value>
        [DataMember(Name = "referenceNumber", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "referenceNumber")]
        public string ReferenceNumber { get; set; }

        /// <summary>
        /// SDK transaction id
        /// </summary>
        /// <value>SDK transaction id</value>
        [DataMember(Name = "transactionId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "transactionId")]
        public string TransactionId { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class AuthDataAppInfo {\n");
            sb.Append("  AppId: ").Append(AppId).Append("\n");
            sb.Append("  EncData: ").Append(EncData).Append("\n");
            sb.Append("  Crv: ").Append(Crv).Append("\n");
            sb.Append("  Kty: ").Append(Kty).Append("\n");
            sb.Append("  Xv: ").Append(Xv).Append("\n");
            sb.Append("  Yv: ").Append(Yv).Append("\n");
            sb.Append("  MaximumTimeout: ").Append(MaximumTimeout).Append("\n");
            sb.Append("  ReferenceNumber: ").Append(ReferenceNumber).Append("\n");
            sb.Append("  TransactionId: ").Append(TransactionId).Append("\n");
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
