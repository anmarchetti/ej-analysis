using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// This element contains the details of the payment method (i.e. card, ELV, Apple pay).
    /// </summary>
    [DataContract]
    public class MakePaymentRequestPaymentDetail
    {
        /// <summary>
        /// Gets or Sets Card
        /// </summary>
        [DataMember(Name = "card", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "card")]
        public Card Card { get; set; }

        /// <summary>
        /// Gets or Sets AuthData
        /// </summary>
        [DataMember(Name = "authData", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "authData")]
        public AuthData AuthData { get; set; }

        /// <summary>
        /// 20 character long value. The reference to the Member/customer making the reservation. Currently the ERES Member Id is being used. The Airport, Call centre, B2B channels may not be able to infer the customer member details. The Web channel offer the ability for a customer to create an account. Therefore Web channel where possible should send this value. The Payment Service does not validate this value against reservation system.
        /// </summary>
        /// <value>20 character long value. The reference to the Member/customer making the reservation. Currently the ERES Member Id is being used. The Airport, Call centre, B2B channels may not be able to infer the customer member details. The Web channel offer the ability for a customer to create an account. Therefore Web channel where possible should send this value. The Payment Service does not validate this value against reservation system.</value>
        [DataMember(Name = "customerReference", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "customerReference")]
        public string CustomerReference { get; set; }

        /// <summary>
        /// The possible values are (1)ApplePay, (2)Card, (3)ELV, (4)BankAccount
        /// </summary>
        /// <value>The possible values are (1)ApplePay, (2)Card, (3)ELV, (4)BankAccount</value>
        [DataMember(Name = "paymentMethod", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paymentMethod")]
        public string PaymentMethod { get; set; }

        /// <summary>
        /// Boolean flag (true or false) indicating whether the payment method should be saved for future use. Only Card and Elv payment method can be stored at the moment.
        /// </summary>
        /// <value>Boolean flag (true or false) indicating whether the payment method should be saved for future use. Only Card and Elv payment method can be stored at the moment.</value>
        [DataMember(Name = "savePaymentMethod", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "savePaymentMethod")]
        public bool? SavePaymentMethod { get; set; }

        /// <summary>
        /// The reference to a saved payment method in the Payment Service. This value must be a UUID value. The Payment Service uses this value retrieve the saved details. The Payment Service expects the mapping between the saved payment method reference and customer to have been validated in the reservation or any other system.
        /// </summary>
        /// <value>The reference to a saved payment method in the Payment Service. This value must be a UUID value. The Payment Service uses this value retrieve the saved details. The Payment Service expects the mapping between the saved payment method reference and customer to have been validated in the reservation or any other system.</value>
        [DataMember(Name = "savedPaymentMethodReference", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "savedPaymentMethodReference")]
        public string SavedPaymentMethodReference { get; set; }

        /// <summary>
        /// A reference that uniquely correlate multiple requests as part of 3DS2 interaction.
        /// </summary>
        /// <value>A reference that uniquely correlate multiple requests as part of 3DS2 interaction.</value>
        [DataMember(Name = "transactionReference", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "transactionReference")]
        public string TransactionReference { get; set; }

        /// <summary>
        /// A flag to indicate secure corporate payment processing as part of PSD2 Article 17 exemption. (Applies to B2B GDS partners only)
        /// </summary>
        /// <value>A flag to indicate secure corporate payment processing as part of PSD2 Article 17 exemption. (Applies to B2B GDS partners only)</value>
        [DataMember(Name = "corporateSecured", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "corporateSecured")]
        public bool? CorporateSecured { get; set; }
        
        /// <summary>
        /// Gets or Sets ApplePay Info
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
            sb.Append("class MakePaymentRequestPaymentDetail {\n");
            sb.Append("  Card: ").Append(Card).Append('\n');
            sb.Append("  AuthData: ").Append(AuthData).Append('\n');
            sb.Append("  CustomerReference: ").Append(CustomerReference).Append('\n');
            sb.Append("  PaymentMethod: ").Append(PaymentMethod).Append('\n');
            sb.Append("  SavePaymentMethod: ").Append(SavePaymentMethod).Append('\n');
            sb.Append("  SavedPaymentMethodReference: ").Append(SavedPaymentMethodReference).Append('\n');
            sb.Append("  TransactionReference: ").Append(TransactionReference).Append('\n');
            sb.Append("  CorporateSecured: ").Append(CorporateSecured).Append('\n');
            sb.Append("  ApplePay: ").Append(ApplePay).Append('\n');
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
