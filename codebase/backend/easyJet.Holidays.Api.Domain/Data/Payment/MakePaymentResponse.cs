using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    [Serializable]
    [DataContract]
    public class MakePaymentResponse
    {
        /// <summary>
        /// The available result codes are: Identify, Challenge 
        /// </summary>
        [DataMember(Name = "resultCode")]
        public string ResultCode { get; set; }

        /// <summary>
        /// Amount paid
        /// </summary>
        public decimal Amount { get; set; }

        /// <summary>
        /// Currency code
        /// </summary>
        public string Currency { get; set; }

        /// <summary>
        /// Card number from response
        /// </summary>
        public string CardNumber { get; set; }

        #region Identify Fields

        /// <summary>
        /// 3DS server transaction ID
        /// </summary>
        [DataMember(Name = "threeDSServerTransID")]
        public string ThreeDSServerTransID { get; set; }

        /// <summary>
        /// Payment transaction reference
        /// </summary>
        [DataMember(Name = "transactionReference")]
        public string TransactionReference { get; set; }

        /// <summary>
        /// 3DS service URL
        /// </summary>
        [DataMember(Name = "threeDSMethodURL")]
        public string ThreeDSMethodURL { get; set; }

        /// <summary>
        /// 3DS callback URL
        /// </summary>
        [DataMember(Name = "methodNotificationURL")]
        public string MethodNotificationURL { get; set; }

        #endregion

        #region Challenge Specific Fields

        /// <summary>
        /// 3DS server transaction ID
        /// </summary>
        [DataMember(Name = "acsTransID")]
        public string AcsTransID { get; set; }

        /// <summary>
        /// message version 
        /// </summary>
        [DataMember(Name = "messageVersion")]
        public string MessageVersion { get; set; }

        /// <summary>
        /// 3DS service URL 
        /// </summary>
        [DataMember(Name = "acsURL")]
        public string AcsURL { get; set; }

        #endregion

        #region 3DS1 data

        /// <summary>
        /// The URL that channel has to redirect in order for the customer to complete 3D Secure authorisation.
        /// </summary>
        [DataMember(Name = "issuerUrl")]
        public Uri IssuerUrl { get; set; }

        /// <summary>
        /// Encryption value that has to be sent to the Issuer
        /// </summary>
        [DataMember(Name = "md")]
        public string Md { get; set; }

        /// <summary>
        /// Encryption value that has to be sent to the Issuer.
        /// </summary>
        [DataMember(Name = "paReq")]
        public string PaReq { get; set; }

        /// <summary>
        /// The endpoint that will receive the 3DS1 challenge completion notification
        /// </summary>
        [DataMember(Name = "termUrl")]
        public string TermUrl { get; set; }

        #endregion

        /// <summary>
        ///  authorisation code from the external Payment Gateway 
        /// </summary>
        public string AuthCode { get; set; }

        /// <summary>
        /// transaction number from the external Payment Gateway
        /// </summary>
        public string TransNo { get; set; }

        /// <summary>
        /// transaction time from the external Payment Gateway
        /// </summary>
        public string TransactionTime { get; set; }

        /// <summary>
        /// payment provider from the external Payment Gateway
        /// </summary>
        public string PayDetails { get; set; }

        /// <summary>
        /// payment ID retrieved from Payment Gateway
        /// </summary>
        public string PaymentId { get; set; }

        /// <summary>
        /// Card type identified
        /// </summary>
        public string PaymentMethodTypeCode { get; set; }

        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "bookingReference")]
        public string BookingReference { get; set; }

        /// <summary>
        /// Session ID
        /// </summary>
        [DataMember(Name = "sessionId")]
        public string SessionId { get; set; }

        /// <summary>
        /// Request ID
        /// </summary>
        public string RequestId { get; set; }
    }
}

