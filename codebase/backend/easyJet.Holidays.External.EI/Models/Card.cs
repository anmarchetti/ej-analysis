using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// This must be populated if paying with a card (e.g. MasterCard, Visa)
    /// </summary>
    [DataContract]
    public class Card
    {
        /// <summary>
        /// Gets or Sets BillingAddress
        /// </summary>
        [DataMember(Name = "billingAddress", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "billingAddress")]
        public CardBillingAddress BillingAddress { get; set; }

        /// <summary>
        /// Input the encrypted TokenNumber instead of card number
        /// </summary>
        /// <value>Input the encrypted TokenNumber instead of card number</value>
        [DataMember(Name = "cardNumber", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "cardNumber")]
        public string CardNumber { get; set; }

        /// <summary>
        /// The security code of the card (CVV, CV2)
        /// </summary>
        /// <value>The security code of the card (CVV, CV2)</value>
        [DataMember(Name = "cardSecurityNumber", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "cardSecurityNumber")]
        public string CardSecurityNumber { get; set; }

        /// <summary>
        /// The supported card types for a Channel is provided by the 'GetPaymentMethods' API
        /// </summary>
        /// <value>The supported card types for a Channel is provided by the 'GetPaymentMethods' API</value>
        [DataMember(Name = "cardType", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "cardType")]
        public string CardType { get; set; }

        /// <summary>
        /// The 2 digit expiry month of the card
        /// </summary>
        /// <value>The 2 digit expiry month of the card</value>
        [DataMember(Name = "expiryMonth", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "expiryMonth")]
        public int? ExpiryMonth { get; set; }

        /// <summary>
        /// The 4 digit expiry year of the card
        /// </summary>
        /// <value>The 4 digit expiry year of the card</value>
        [DataMember(Name = "expiryYear", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "expiryYear")]
        public int? ExpiryYear { get; set; }

        /// <summary>
        /// Issue Number for the card
        /// </summary>
        /// <value>Issue Number for the card</value>
        [DataMember(Name = "issueNumber", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "issueNumber")]
        public string IssueNumber { get; set; }

        /// <summary>
        /// The Card holder name
        /// </summary>
        /// <value>The Card holder name</value>
        [DataMember(Name = "nameOnCard", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "nameOnCard")]
        public string NameOnCard { get; set; }

        /// <summary>
        /// Gets or Sets PayerAuthToken
        /// </summary>
        [DataMember(Name = "payerAuthToken", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "payerAuthToken")]
        public PayerAuthToken PayerAuthToken { get; set; }

        /// <summary>
        /// Card start month
        /// </summary>
        /// <value>Card start month</value>
        [DataMember(Name = "startMonth", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "startMonth")]
        public int? StartMonth { get; set; }

        /// <summary>
        /// Card start year
        /// </summary>
        /// <value>Card start year</value>
        [DataMember(Name = "startYear", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "startYear")]
        public int? StartYear { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class Card {\n");
            sb.Append("  BillingAddress: ").Append(BillingAddress).Append("\n");
            sb.Append("  CardNumber: ").Append(CardNumber).Append("\n");
            sb.Append("  CardSecurityNumber: ").Append(CardSecurityNumber).Append("\n");
            sb.Append("  CardType: ").Append(CardType).Append("\n");
            sb.Append("  ExpiryMonth: ").Append(ExpiryMonth).Append("\n");
            sb.Append("  ExpiryYear: ").Append(ExpiryYear).Append("\n");
            sb.Append("  IssueNumber: ").Append(IssueNumber).Append("\n");
            sb.Append("  NameOnCard: ").Append(NameOnCard).Append("\n");
            sb.Append("  PayerAuthToken: ").Append(PayerAuthToken).Append("\n");
            sb.Append("  StartMonth: ").Append(StartMonth).Append("\n");
            sb.Append("  StartYear: ").Append(StartYear).Append("\n");
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
