using easyJet.Holidays.External.Domain.Models.Api;
using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{
    public class CancelPaymentRequest : JsonApiRequest<CancelPaymentRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Put;
    }

    /// <summary>
    /// CancelRequest
    /// </summary>
    [DataContract]
    public class CancelPaymentRequestBody
    {
        /// <summary>
        /// The channel that is requesting the action. The possible values are Web, Mobile, CallCentre, Airport and B2B.
        /// </summary>
        /// <value>The channel that is requesting the action. The possible values are Web, Mobile, CallCentre, Airport and B2B.</value>
        [DataMember(Name = "channel", EmitDefaultValue = false)]
        public string Channel { get; set; }

        /// <summary>
        /// Payment Id to cancel.
        /// </summary>
        /// <value>Payment Id to cancel.</value>
        [DataMember(Name = "paymentId", EmitDefaultValue = false)]
        public string PaymentId { get; set; }

        /// <summary>
        /// Gets or Sets ClientData
        /// </summary>
        [DataMember(Name = "clientData", EmitDefaultValue = false)]
        public CancelRequestClientData ClientData { get; set; }

        /// <summary>
        /// The reference of the transaction. A transaction reference is required for cancellations originating from the ERES platform. For ERES transactions, reference should match the reference of the payment that is being cancelled.
        /// </summary>
        /// <value>The reference of the transaction. A transaction reference is required for cancellations originating from the ERES platform. For ERES transactions, reference should match the reference of the payment that is being cancelled.</value>
        [DataMember(Name = "reference", EmitDefaultValue = false)]
        public string Reference { get; set; }

        /// <summary>
        /// Additional meta-data that can be included in the request.
        /// </summary>
        /// <value>Additional meta-data that can be included in the request.</value>
        [DataMember(Name = "additionalData", EmitDefaultValue = false)]
        public List<Kvp> AdditionalData { get; set; }

        /// <summary>
        /// Returns the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class CancelRequest {\n");
            sb.Append("  Channel: ").Append(Channel).Append("\n");
            sb.Append("  PaymentId: ").Append(PaymentId).Append("\n");
            sb.Append("  ClientData: ").Append(ClientData).Append("\n");
            sb.Append("  Reference: ").Append(Reference).Append("\n");
            sb.Append("  AdditionalData: ").Append(AdditionalData).Append("\n");
            sb.Append("}\n");
            return sb.ToString();
        }

        /// <summary>
        /// Returns the JSON string presentation of the object
        /// </summary>
        /// <returns>JSON string presentation of the object</returns>
        public virtual string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }
    }

}
