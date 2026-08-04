using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{
    /// <summary>
    /// This must be populated if paying with ApplePay
    /// </summary>
    [DataContract]
    public class ApplePay
    {
        /// <summary>
        /// The supported card types for a Channel is provided by the 'GetPaymentMethods' API
        /// </summary>
        [DataMember(Name = "cardType", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "cardType")]
        public string CardType { get; set; }

        /// <summary>
        /// The payment data block from Apple Pay token encoded in base64
        /// </summary>
        [DataMember(Name = "token", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "token")]
        public string Base64Token { get; set; }

        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("class ApplePay {\n");
            sb.Append("  CardType: ").Append(CardType).Append('\n');
            sb.Append("  Base64Token: ").Append(Base64Token).Append('\n');
            sb.Append("}\n");
            return sb.ToString();
        }

        /// <summary>
        /// Get the JSON string presentation of the object
        /// </summary>
        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }
    }
}