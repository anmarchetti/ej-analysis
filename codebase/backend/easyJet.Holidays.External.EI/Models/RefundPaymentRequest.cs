using easyJet.Holidays.External.Domain.Models.Api;
using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{
    public class RefundPaymentRequest : JsonApiRequest<RefundPaymentRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }


    /// <summary>
    /// Refund Request
    /// </summary>
    [DataContract]
    public class RefundPaymentRequestBody
    {
        /// <summary>
        /// The channel that is requesting the action. The possible values are Web, Mobile, CallCentre, Airport and B2B.
        /// </summary>
        /// <value>The channel that is requesting the action. The possible values are Web, Mobile, CallCentre, Airport and B2B.</value>
        [DataMember(Name = "channel", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "channel")]
        public string Channel { get; set; }

        /// <summary>
        /// Payment Id to refund.
        /// </summary>
        /// <value>Payment Id to refund.</value>
        [DataMember(Name = "paymentId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paymentId")]
        public string PaymentId { get; set; }

        /// <summary>
        /// Gets or Sets ClientData
        /// </summary>
        [DataMember(Name = "clientData", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "clientData")]
        public RefundRequestClientData ClientData { get; set; }

        /// <summary>
        /// The reference of the transaction. A transaction reference is required for cancellations originating from the ERES platform. For ERES transactions, reference should match the reference of the payment that is being cancelled.
        /// </summary>
        /// <value>The reference of the transaction. A transaction reference is required for cancellations originating from the ERES platform. For ERES transactions, reference should match the reference of the payment that is being cancelled.</value>
        [DataMember(Name = "reference", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "reference")]
        public string Reference { get; set; }

        /// <summary>
        /// Gets or Sets Amount
        /// </summary>
        [DataMember(Name = "amount", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "amount")]
        public RefundAmount Amount { get; set; }

        /// <summary>
        /// Additional meta-data that can be included in the request.
        /// </summary>
        /// <value>Additional meta-data that can be included in the request.</value>
        [DataMember(Name = "additionalData", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "additionalData")]
        public List<Kvp> AdditionalData { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class RefundRequest {\n");
            sb.Append("  Channel: ").Append(Channel).Append("\n");
            sb.Append("  PaymentId: ").Append(PaymentId).Append("\n");
            sb.Append("  ClientData: ").Append(ClientData).Append("\n");
            sb.Append("  Reference: ").Append(Reference).Append("\n");
            sb.Append("  Amount: ").Append(Amount).Append("\n");
            sb.Append("  AdditionalData: ").Append(AdditionalData).Append("\n");
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
