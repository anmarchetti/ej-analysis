using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// This element is used to send arbitrary pieces of information to the Payment Service.
    /// </summary>
    [DataContract]
    public class MakePaymentRequestClientData
    {
        /// <summary>
        /// IP Address of the channel from where the customer will be making the reservation.
        /// </summary>
        /// <value>IP Address of the channel from where the customer will be making the reservation.</value>
        [DataMember(Name = "ipAddress", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "ipAddress")]
        public string IpAddress { get; set; }

        /// <summary>
        /// The email address of the customer.
        /// </summary>
        /// <value>The email address of the customer.</value>
        [DataMember(Name = "emailAddress", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "emailAddress")]
        public string EmailAddress { get; set; }

        /// <summary>
        /// InAuth transaction id (where applicable)
        /// </summary>
        /// <value>InAuth transaction id (where applicable)</value>
        [DataMember(Name = "deviceId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "deviceId")]
        public string DeviceId { get; set; }

        /// <summary>
        /// Reference to the customer profile. For ERES, this refers to the MemberId
        /// </summary>
        /// <value>Reference to the customer profile. For ERES, this refers to the MemberId</value>
        [DataMember(Name = "profileId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "profileId")]
        public string ProfileId { get; set; }

        /// <summary>
        /// A key that uniquely identify the client that is using this API. This key is provided by the Payment Service.
        /// </summary>
        /// <value>A key that uniquely identify the client that is using this API. This key is provided by the Payment Service.</value>
        [DataMember(Name = "apiKey", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "apiKey")]
        public string ApiKey { get; set; }

        /// <summary>
        /// Booker phone number including country code.
        /// </summary>
        /// <value>Booker phone number including country code.</value>
        [DataMember(Name = "phoneNumber", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "phoneNumber")]
        public string PhoneNumber { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentRequestClientData {\n");
            sb.Append("  IpAddress: ").Append(IpAddress).Append("\n");
            sb.Append("  EmailAddress: ").Append(EmailAddress).Append("\n");
            sb.Append("  DeviceId: ").Append(DeviceId).Append("\n");
            sb.Append("  ProfileId: ").Append(ProfileId).Append("\n");
            sb.Append("  ApiKey: ").Append(ApiKey).Append("\n");
            sb.Append("  PhoneNumber: ").Append(PhoneNumber).Append("\n");
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
