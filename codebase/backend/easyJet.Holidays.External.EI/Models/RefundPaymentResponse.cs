using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{
    public class RefundPaymentResponse : JsonApiResponse<RefundPaymentResponseBody>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }

    /// <summary>
    /// RefundResponse
    /// </summary>
    [DataContract]
    public class RefundPaymentResponseBody
    {
        /// <summary>
        /// The refund payment Id.
        /// </summary>
        /// <value>The refund payment Id.</value>
        [DataMember(Name = "paymentId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paymentId")]
        public string PaymentId { get; set; }

        /// <summary>
        /// Gets or Sets TransactionDetail
        /// </summary>
        [DataMember(Name = "transactionDetail", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "transactionDetail")]
        public TransactionDetail TransactionDetail { get; set; }

        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class RefundResponse {\n");
            sb.Append("  PaymentId: ").Append(PaymentId).Append("\n");
            sb.Append("  TransactionDetail: ").Append(TransactionDetail).Append("\n");
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
