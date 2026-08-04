using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// Contains the amount that is to be charged from the customer.
    /// </summary>
    [DataContract]
    public class MakePaymentRequestAmount
    {
        /// <summary>
        /// The ISO 4217 3 digit currency code. The currency code must one of the easyJet acceptable currencies. The acceptable currencies at the moment are (1)EUR, (2)CHF, (3)GBP, (4)CSK, (5)DKK, (6)HUF, (7)PLN, (8)SEK, (9)USD, (10)MAD
        /// </summary>
        /// <value>The ISO 4217 3 digit currency code. The currency code must one of the easyJet acceptable currencies. The acceptable currencies at the moment are (1)EUR, (2)CHF, (3)GBP, (4)CSK, (5)DKK, (6)HUF, (7)PLN, (8)SEK, (9)USD, (10)MAD</value>
        [DataMember(Name = "currencyCode", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "currencyCode")]
        public string CurrencyCode { get; set; }

        /// <summary>
        /// Positive value of the amount that is to be charged from the customer (e.g. 12.34)
        /// </summary>
        /// <value>Positive value of the amount that is to be charged from the customer (e.g. 12.34)</value>
        [DataMember(Name = "value", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "value")]
        public decimal? Value { get; set; }

        /// <summary>
        /// This is a list of merchants that easyJet authenticates on customers behalf.
        /// </summary>
        /// <value>This is a list of merchants that easyJet authenticates on customers behalf.</value>
        [DataMember(Name = "additionalMerchants", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "additionalMerchants")]
        public List<MakePaymentRequestAmountAdditionalMerchants> AdditionalMerchants { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentRequestAmount {\n");
            sb.Append("  CurrencyCode: ").Append(CurrencyCode).Append("\n");
            sb.Append("  Value: ").Append(Value).Append("\n");
            sb.Append("  AdditionalMerchants: ").Append(AdditionalMerchants).Append("\n");
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
