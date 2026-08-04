using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{
    public class MakePaymentResponse : JsonApiResponse<MakePaymentResponseBody>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }

    /// <summary>
    /// Make payment response which enables a payment to be made to settle a booking
    /// </summary>
    [DataContract]
    public class MakePaymentResponseBody
    {
        /// <summary>
        /// Message to indicate result of the transaction. This will include the failure message if the payment was declined.
        /// </summary>
        /// <value>Message to indicate result of the transaction. This will include the failure message if the payment was declined.</value>
        [DataMember(Name = "message", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "message")]
        public string Message { get; set; }

        /// <summary>
        /// Validation error code. Refer to the Error Handling section for the full list.The validation error code should be used in conjunction with 'Message' element.
        /// </summary>
        /// <value>Validation error code. Refer to the Error Handling section for the full list.The validation error code should be used in conjunction with 'Message' element.</value>
        [DataMember(Name = "messageCode", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "messageCode")]
        public string MessageCode { get; set; }

        /// <summary>
        /// Gets or Sets Amount
        /// </summary>
        [DataMember(Name = "amount", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "amount")]
        public MakePaymentResponseAmount Amount { get; set; }

        /// <summary>
        /// Gets or Sets PayerAuthToken
        /// </summary>
        [DataMember(Name = "payerAuthToken", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "payerAuthToken")]
        public PayerAuthToken PayerAuthToken { get; set; }

        /// <summary>
        /// Unique identification of the payment transaction.
        /// </summary>
        /// <value>Unique identification of the payment transaction.</value>
        [DataMember(Name = "paymentId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paymentId")]
        public string PaymentId { get; set; }

        /// <summary>
        /// Payment method specified in the request. Card is the payment method supported now. The values that would be supported in future are None, ApplePay, Cash, Cheque, CreditAccount,Elv, BankAccount, Ideal, Voucher
        /// </summary>
        /// <value>Payment method specified in the request. Card is the payment method supported now. The values that would be supported in future are None, ApplePay, Cash, Cheque, CreditAccount,Elv, BankAccount, Ideal, Voucher</value>
        [DataMember(Name = "paymentMethod", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paymentMethod")]
        public string PaymentMethod { get; set; }

        /// <summary>
        /// The payment type that was specified in the request. (e.g. AX, MC, VI)
        /// </summary>
        /// <value>The payment type that was specified in the request. (e.g. AX, MC, VI)</value>
        [DataMember(Name = "paymentMethodTypeCode", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paymentMethodTypeCode")]
        public string PaymentMethodTypeCode { get; set; }

        /// <summary>
        /// The available result codes are: (1)Success - Transaction was successful, (2)Failed - Transaction failed due to technical fault, (3)Rejected - Transaction was rejected, (4)Redirect - Transaction require client redirection.
        /// </summary>
        /// <value>The available result codes are: (1)Success - Transaction was successful, (2)Failed - Transaction failed due to technical fault, (3)Rejected - Transaction was rejected, (4)Redirect - Transaction require client redirection.</value>
        [DataMember(Name = "resultCode", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "resultCode")]
        public string ResultCode { get; set; }

        /// <summary>
        /// Gets or Sets TransactionDetail
        /// </summary>
        [DataMember(Name = "transactionDetail", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "transactionDetail")]
        public MakePaymentResponseTransactionDetail TransactionDetail { get; set; }

        /// <summary>
        /// Status of the transaction. The available transaction status codes are: (1)None - No transaction status. Used for Step 1 of 3D Secure payments., (2)Authorized - Payment has been accepted for processing (used with refunds, credit payments and cancellations). (3)Declined - Payment has been declined. Refer to 'Message' to determine why the payment has declined. (4)Failed - Payment has failed (5)OfflineAccepted - The payment has been accepted for offline processing. (6)SentForSettlement - The payment has been submitted for settlement. (7)Cancelled - The payment has been cancelled. (8)CancellationFailed - Payment cancelled has failed. (9)Voided - Payment no longer valid.
        /// </summary>
        /// <value>Status of the transaction. The available transaction status codes are: (1)None - No transaction status. Used for Step 1 of 3D Secure payments., (2)Authorized - Payment has been accepted for processing (used with refunds, credit payments and cancellations). (3)Declined - Payment has been declined. Refer to 'Message' to determine why the payment has declined. (4)Failed - Payment has failed (5)OfflineAccepted - The payment has been accepted for offline processing. (6)SentForSettlement - The payment has been submitted for settlement. (7)Cancelled - The payment has been cancelled. (8)CancellationFailed - Payment cancelled has failed. (9)Voided - Payment no longer valid.</value>
        [DataMember(Name = "transactionStatus", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "transactionStatus")]
        public string TransactionStatus { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentResponse {\n");
            sb.Append("  Message: ").Append(Message).Append("\n");
            sb.Append("  MessageCode: ").Append(MessageCode).Append("\n");
            sb.Append("  Amount: ").Append(Amount).Append("\n");
            sb.Append("  PayerAuthToken: ").Append(PayerAuthToken).Append("\n");
            sb.Append("  PaymentId: ").Append(PaymentId).Append("\n");
            sb.Append("  PaymentMethod: ").Append(PaymentMethod).Append("\n");
            sb.Append("  PaymentMethodTypeCode: ").Append(PaymentMethodTypeCode).Append("\n");
            sb.Append("  ResultCode: ").Append(ResultCode).Append("\n");
            sb.Append("  TransactionDetail: ").Append(TransactionDetail).Append("\n");
            sb.Append("  TransactionStatus: ").Append(TransactionStatus).Append("\n");
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
