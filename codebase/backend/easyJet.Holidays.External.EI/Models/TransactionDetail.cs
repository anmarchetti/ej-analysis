using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// 
    /// </summary>
    [DataContract]
    public class TransactionDetail
    {
        /// <summary>
        /// Payment method used for original payment.The possible values are  (1)ApplePay, (2)Card, (3)ELV, (4)BankAccount
        /// </summary>
        /// <value>Payment method used for original payment.The possible values are  (1)ApplePay, (2)Card, (3)ELV, (4)BankAccount</value>
        [DataMember(Name = "paymentMethod", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paymentMethod")]
        public string PaymentMethod { get; set; }

        /// <summary>
        /// Payment method type code (e.g. VI, MC).
        /// </summary>
        /// <value>Payment method type code (e.g. VI, MC).</value>
        [DataMember(Name = "paymentType", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paymentType")]
        public string PaymentType { get; set; }

        /// <summary>
        /// Gets or Sets Amount
        /// </summary>
        [DataMember(Name = "amount", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "amount")]
        public RefundAmount Amount { get; set; }

        /// <summary>
        /// Status of the transaction. The possible values are Authorized, Failed, Success]
        /// </summary>
        /// <value>Status of the transaction. The possible values are Authorized, Failed, Success]</value>
        [DataMember(Name = "status", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "status")]
        public string Status { get; set; }

        /// <summary>
        /// Indicates the result of the action.The possible values are Success, Failed, Rejected
        /// </summary>
        /// <value>Indicates the result of the action.The possible values are Success, Failed, Rejected</value>
        [DataMember(Name = "result", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "result")]
        public string Result { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class TransactionDetail {\n");
            sb.Append("  PaymentMethod: ").Append(PaymentMethod).Append("\n");
            sb.Append("  PaymentType: ").Append(PaymentType).Append("\n");
            sb.Append("  Amount: ").Append(Amount).Append("\n");
            sb.Append("  Status: ").Append(Status).Append("\n");
            sb.Append("  Result: ").Append(Result).Append("\n");
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
