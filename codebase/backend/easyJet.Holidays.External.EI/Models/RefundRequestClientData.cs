using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{
    /// <summary>
    /// 
    /// </summary>
    [DataContract]
    public class RefundRequestClientData
    {
        /// <summary>
        /// InAuth fraud screening transaction reference, if one available
        /// </summary>
        /// <value>InAuth fraud screening transaction reference, if one available</value>
        [DataMember(Name = "deviceId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "deviceId")]
        public string DeviceId { get; set; }

        /// <summary>
        /// Customer email address if one provided.
        /// </summary>
        /// <value>Customer email address if one provided.</value>
        [DataMember(Name = "emailAddress", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "emailAddress")]
        public string EmailAddress { get; set; }

        /// <summary>
        /// The IP address of the requester.
        /// </summary>
        /// <value>The IP address of the requester.</value>
        [DataMember(Name = "ipAddress", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "ipAddress")]
        public string IpAddress { get; set; }

        /// <summary>
        /// A key issued by Payment Service that uniquely identify a client/platform.
        /// </summary>
        /// <value>A key issued by Payment Service that uniquely identify a client/platform.</value>
        [DataMember(Name = "apiKey", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "apiKey")]
        public string ApiKey { get; set; }

        /// <summary>
        /// The customer reference that is requesting action. In ERES, this refers to the MemberId.
        /// </summary>
        /// <value>The customer reference that is requesting action. In ERES, this refers to the MemberId.</value>
        [DataMember(Name = "profileId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "profileId")]
        public string ProfileId { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class RefundRequestClientData {\n");
            sb.Append("  DeviceId: ").Append(DeviceId).Append("\n");
            sb.Append("  EmailAddress: ").Append(EmailAddress).Append("\n");
            sb.Append("  IpAddress: ").Append(IpAddress).Append("\n");
            sb.Append("  ApiKey: ").Append(ApiKey).Append("\n");
            sb.Append("  ProfileId: ").Append(ProfileId).Append("\n");
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
