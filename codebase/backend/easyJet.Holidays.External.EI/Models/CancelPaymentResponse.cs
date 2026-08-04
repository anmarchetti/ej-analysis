using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{
    public class CancelPaymentResponse : JsonApiResponse<CancelPaymentResponseBody>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }

    /// <summary>
    /// CancelResponse
    /// </summary>
    [DataContract]
    public partial class CancelPaymentResponseBody
    {
        /// <summary>
        /// The cancellation payment Id.
        /// </summary>
        /// <value>The cancellation payment Id.</value>
        [DataMember(Name = "paymentId", EmitDefaultValue = false)]
        public string PaymentId { get; set; }

        /// <summary>
        /// Returns the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class CancelResponse {\n");
            sb.Append("  PaymentId: ").Append(PaymentId).Append("\n");
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
