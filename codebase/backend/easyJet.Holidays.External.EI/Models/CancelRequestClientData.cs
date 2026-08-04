using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{
    /// <summary>
    /// CancelRequestClientData
    /// </summary>
    [DataContract]
    public partial class CancelRequestClientData
    {
        /// <summary>
        /// InAuth fraud screening transaction reference, if one available
        /// </summary>
        /// <value>InAuth fraud screening transaction reference, if one available</value>
        [DataMember(Name = "deviceId", EmitDefaultValue = false)]
        public string DeviceId { get; set; }

        /// <summary>
        /// Customer email address if one provided.
        /// </summary>
        /// <value>Customer email address if one provided.</value>
        [DataMember(Name = "emailAddress", EmitDefaultValue = false)]
        public string EmailAddress { get; set; }

        /// <summary>
        /// The IP address of the requester.
        /// </summary>
        /// <value>The IP address of the requester.</value>
        [DataMember(Name = "ipAddress", EmitDefaultValue = false)]
        public string IpAddress { get; set; }

        /// <summary>
        /// A key issued by Payment Service that uniquely identify a client/platform.
        /// </summary>
        /// <value>A key issued by Payment Service that uniquely identify a client/platform.</value>
        [DataMember(Name = "apiKey", EmitDefaultValue = false)]
        public string ApiKey { get; set; }

        /// <summary>
        /// The reference to customer that requested this action. In ERES this refers to the MemeberId.
        /// </summary>
        /// <value>The reference to customer that requested this action. In ERES this refers to the MemeberId.</value>
        [DataMember(Name = "profileId", EmitDefaultValue = false)]
        public string ProfileId { get; set; }

        /// <summary>
        /// Returns the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class CancelRequestClientData {\n");
            sb.Append("  DeviceId: ").Append(DeviceId).Append("\n");
            sb.Append("  EmailAddress: ").Append(EmailAddress).Append("\n");
            sb.Append("  IpAddress: ").Append(IpAddress).Append("\n");
            sb.Append("  ApiKey: ").Append(ApiKey).Append("\n");
            sb.Append("  ProfileId: ").Append(ProfileId).Append("\n");
            sb.Append("}\n");
            return sb.ToString();
        }

        /// <summary>
        /// Returns the JSON string presentation of the object
        /// </summary>
        /// <returns>JSON string presentation of the object</returns>
        public virtual string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }
    }

}
