namespace easyJet.Holidays.Api.Domain.Settings
{
    public class PaymentsSettings
    {
        public UrlSettings MakePayment { get; set; }

        public UrlSettings CancelPayment { get; set; }

        public UrlSettings RefundPayment { get; set; }

        public string ApiKey { get; set; }

        public string Channel { get; set; }

        public string RefundChannel { get; set; }

        public string CustomerServiceUrl { get; set; }

        public string IdentifyNotificationUrl { get; set; }

        public string ThreeDSCallbackHost { get; set; }

        public string ChallengeNotificationUrl { get; set; }

        public string ThreeDSOneNotificationUrl { get; set; }

        public string XPosId { get; set; }

        public string XPosIdRefund { get; set; }

        public string FrontendOrigin { get; set; }

        public string CallbackTemplate { get; set; }

        public PaymentsApiSettings Api { get; set; }

        /// <summary>
        /// Header value which configure Akamai tokenization
        /// </summary>
        public string XInspection { get; set; }

        /// <summary>
        /// Error codes for payment gateway
        /// </summary>
        public ErrorCodesSettings ErrorCodes { get; set; }
    }

    public class PaymentsApiSettings
    {
        /// <summary>
        /// Api requests timeout milliseconds
        /// </summary>
        public int TimeoutMilliSeconds { get; set; }
    }

    public class ErrorCodesSettings
    {
        /// <summary>
        /// 3DS2 fingerprint technical error
        /// </summary>
        public string Fingerprint { get; set; }

        /// <summary>
        /// 3DS2 challenge technical error
        /// </summary>
        public string Challenge { get; set; }

        /// <summary>
        /// 3DS1 authentication technical error
        /// </summary>
        public string Authentication { get; set; }
    }

    /// <summary>
    /// Represents URL settings including host and path.
    /// </summary>
    public class UrlSettings
    {
        /// <summary>
        /// Gets or sets the host of the URL.
        /// </summary>
        public string Host { get; set; }

        /// <summary>
        /// Gets or sets the path of the URL.
        /// </summary>
        public string Path { get; set; }
    }
}