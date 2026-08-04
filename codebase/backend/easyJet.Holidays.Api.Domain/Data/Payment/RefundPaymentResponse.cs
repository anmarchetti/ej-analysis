using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    /// <summary>
    /// Payment Refund response
    /// </summary>
    [DataContract]
    public class RefundPaymentResponse
    {
        /// <summary>
        /// The refund payment Id.
        /// </summary>
        /// <value>The refund payment Id.</value>
        [DataMember(Name = "paymentId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paymentId")]
        public string PaymentId { get; set; }

        /// <summary>
        /// Status of the transaction. The possible values are Authorized, Failed, Success]
        /// </summary>IOperationFilter
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
    }
}
