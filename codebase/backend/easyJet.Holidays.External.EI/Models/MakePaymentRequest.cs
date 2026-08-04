using easyJet.Holidays.External.Domain.Models.Api;
using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{
    public class MakePaymentRequest : JsonApiRequest<MakePaymentRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;

    }

    /// <summary>
    /// Make payment request which enables a payment to be made to settle a booking
    /// </summary>
    [DataContract]
    public class MakePaymentRequestBody
    {
        /// <summary>
        /// Gets or Sets ClientData
        /// </summary>
        [DataMember(Name = "clientData", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "clientData")]
        public MakePaymentRequestClientData ClientData { get; set; }

        /// <summary>
        /// Gets or Sets OrderData
        /// </summary>
        [DataMember(Name = "orderData", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "orderData")]
        public OrderData OrderData { get; set; }

        /// <summary>
        /// This is used to provide arbitrary information that can be used to influence how the payment is processed or fraud screened. The keys must be agreed with the Payments team.
        /// </summary>
        /// <value>This is used to provide arbitrary information that can be used to influence how the payment is processed or fraud screened. The keys must be agreed with the Payments team.</value>
        [DataMember(Name = "additionalData", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "additionalData")]
        public List<MakePaymentRequestAdditionalData> AdditionalData { get; set; }

        /// <summary>
        /// Gets or Sets AirlineData
        /// </summary>
        [DataMember(Name = "airlineData", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "airlineData")]
        public MakePaymentRequestAirlineData AirlineData { get; set; }

        /// <summary>
        /// Gets or Sets Lodging
        /// </summary>
        [DataMember(Name = "lodging", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "lodging")]
        public Lodging Lodging { get; set; }

        /// <summary>
        /// Gets or Sets Amount
        /// </summary>
        [DataMember(Name = "amount", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "amount")]
        public MakePaymentRequestAmount Amount { get; set; }

        /// <summary>
        /// Gets or Sets BrowserInfo
        /// </summary>
        [DataMember(Name = "browserInfo", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "browserInfo")]
        public MakePaymentRequestBrowserInfo BrowserInfo { get; set; }

        /// <summary>
        /// The channel issuing the payment. The possible values are 1)Web, (2)CallCentre
        /// </summary>
        /// <value>The channel issuing the payment. The possible values are 1)Web, (2)CallCentre</value>
        [DataMember(Name = "channel", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "channel")]
        public string Channel { get; set; }

        /// <summary>
        /// The 2 digit country code. Populate this with the details of earliest flight which hasn't flown
        /// </summary>
        /// <value>The 2 digit country code. Populate this with the details of earliest flight which hasn't flown</value>
        [DataMember(Name = "departureCountry", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "departureCountry")]
        public string DepartureCountry { get; set; }

        /// <summary>
        /// The date and time of the earliest leg in YYYY-MM-DDTHH:MM:SS format. Example: 2017-03-09T06:55:00. Populate this with the details of earliest flight which hasn't flown
        /// </summary>
        /// <value>The date and time of the earliest leg in YYYY-MM-DDTHH:MM:SS format. Example: 2017-03-09T06:55:00. Populate this with the details of earliest flight which hasn't flown</value>
        [DataMember(Name = "departureDate", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "departureDate")]
        public string DepartureDate { get; set; }

        /// <summary>
        /// The 2 digit language locale. This must be the language set by the customer in the website. This is mandatory for Web and its important to send the exact language code as set by the customer. Example: DE
        /// </summary>
        /// <value>The 2 digit language locale. This must be the language set by the customer in the website. This is mandatory for Web and its important to send the exact language code as set by the customer. Example: DE</value>
        [DataMember(Name = "market", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "market")]
        public string Market { get; set; }

        /// <summary>
        /// Gets or Sets PaymentDetail
        /// </summary>
        [DataMember(Name = "paymentDetail", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paymentDetail")]
        public MakePaymentRequestPaymentDetail PaymentDetail { get; set; }

        /// <summary>
        /// A reference to the payment. Example: E111191
        /// </summary>
        /// <value>A reference to the payment. Example: E111191</value>
        [DataMember(Name = "reference", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "reference")]
        public string Reference { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentRequest {\n");
            sb.Append("  ClientData: ").Append(ClientData).Append("\n");
            sb.Append("  OrderData: ").Append(OrderData).Append("\n");
            sb.Append("  AdditionalData: ").Append(AdditionalData).Append("\n");
            sb.Append("  AirlineData: ").Append(AirlineData).Append("\n");
            sb.Append("  Lodging: ").Append(Lodging).Append("\n");
            sb.Append("  Amount: ").Append(Amount).Append("\n");
            sb.Append("  BrowserInfo: ").Append(BrowserInfo).Append("\n");
            sb.Append("  Channel: ").Append(Channel).Append("\n");
            sb.Append("  DepartureCountry: ").Append(DepartureCountry).Append("\n");
            sb.Append("  DepartureDate: ").Append(DepartureDate).Append("\n");
            sb.Append("  Market: ").Append(Market).Append("\n");
            sb.Append("  PaymentDetail: ").Append(PaymentDetail).Append("\n");
            sb.Append("  Reference: ").Append(Reference).Append("\n");
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
