using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// 
    /// </summary>
    [DataContract]
    public class MakePaymentRequestAmountAdditionalMerchants
    {
        /// <summary>
        /// Name of merchant
        /// </summary>
        /// <value>Name of merchant</value>
        [DataMember(Name = "merchantName", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "merchantName")]
        public string MerchantName { get; set; }

        /// <summary>
        /// Amount that is to be paid for the third-party merchant.
        /// </summary>
        /// <value>Amount that is to be paid for the third-party merchant.</value>
        [DataMember(Name = "value", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "value")]
        public decimal? Value { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentRequestAmountAdditionalMerchants {\n");
            sb.Append("  MerchantName: ").Append(MerchantName).Append("\n");
            sb.Append("  Value: ").Append(Value).Append("\n");
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
