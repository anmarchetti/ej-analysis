using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// The details of the transaction. The contents of the element is based on the initial payment method specified in the request.
    /// </summary>
    [DataContract]
    public class MakePaymentResponseTransactionDetail
    {
        /// <summary>
        /// Authorization Code
        /// </summary>
        /// <value>Authorization Code</value>
        [DataMember(Name = "authCode", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "authCode")]
        public string AuthCode { get; set; }

        /// <summary>
        /// Gets or Sets Card
        /// </summary>
        [DataMember(Name = "card", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "card")]
        public Card Card { get; set; }

        /// <summary>
        /// The local transaction date and time. The min date (0001-01-01T00:00:00) is used for Step 1 of 3D Secure payment.
        /// </summary>
        /// <value>The local transaction date and time. The min date (0001-01-01T00:00:00) is used for Step 1 of 3D Secure payment.</value>
        [DataMember(Name = "transactionTime", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "transactionTime")]
        public string TransactionTime { get; set; }

        /// <summary>
        /// The unique transaction id received from PSP. No transaction id is created for Step 1 of 3D Secure payment.
        /// </summary>
        /// <value>The unique transaction id received from PSP. No transaction id is created for Step 1 of 3D Secure payment.</value>
        [DataMember(Name = "transactionId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "transactionId")]
        public string TransactionId { get; set; }

        /// <summary>
        /// A reference that is used during 3DS2 workflow.
        /// </summary>
        /// <value>A reference that is used during 3DS2 workflow.</value>
        [DataMember(Name = "transactionReference", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "transactionReference")]
        public string TransactionReference { get; set; }

        /// <summary>
        /// The name of the payment provider. The possible values are Unknown,Xenco, Cybersource,Adyen
        /// </summary>
        /// <value>The name of the payment provider. The possible values are Unknown,Xenco, Cybersource,Adyen</value>
        [DataMember(Name = "provider", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "provider")]
        public string Provider { get; set; }

        /// <summary>
        /// The Id for the payment provider (e.g. 100 for Adyen).
        /// </summary>
        /// <value>The Id for the payment provider (e.g. 100 for Adyen).</value>
        [DataMember(Name = "providerId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "providerId")]
        public int? ProviderId { get; set; }

        /// <summary>
        /// Unique reference created within Payment Service that appears on Customers bank account.
        /// </summary>
        /// <value>Unique reference created within Payment Service that appears on Customers bank account.</value>
        [DataMember(Name = "merchantReference", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "merchantReference")]
        public string MerchantReference { get; set; }

        /// <summary>
        /// Reference to a saved payment method in Payments Systems if customer has requested to save the payment method. The 'SavePaymentMethod' element in the request can be set in order to save the payment method. Only Cards and Elv can be saved for future use.
        /// </summary>
        /// <value>Reference to a saved payment method in Payments Systems if customer has requested to save the payment method. The 'SavePaymentMethod' element in the request can be set in order to save the payment method. Only Cards and Elv can be saved for future use.</value>
        [DataMember(Name = "savedPaymentMethodReference", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "savedPaymentMethodReference")]
        public string SavedPaymentMethodReference { get; set; }
        
        /// <summary>
        /// Gets or Sets Card
        /// </summary>
        [DataMember(Name = "applePay", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "applePay")]
        public ApplePay ApplePay { get; set; }

        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentResponseTransactionDetail {\n");
            sb.Append("  AuthCode: ").Append(AuthCode).Append("\n");
            sb.Append("  Card: ").Append(Card).Append("\n");
            sb.Append("  TransactionTime: ").Append(TransactionTime).Append("\n");
            sb.Append("  TransactionId: ").Append(TransactionId).Append("\n");
            sb.Append("  TransactionReference: ").Append(TransactionReference).Append("\n");
            sb.Append("  Provider: ").Append(Provider).Append("\n");
            sb.Append("  ProviderId: ").Append(ProviderId).Append("\n");
            sb.Append("  MerchantReference: ").Append(MerchantReference).Append("\n");
            sb.Append("  SavedPaymentMethodReference: ").Append(SavedPaymentMethodReference).Append("\n");
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
