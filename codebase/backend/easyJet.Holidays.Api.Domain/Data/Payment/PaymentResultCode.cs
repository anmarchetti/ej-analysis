namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    /// <summary>
    /// The result code from EI Gateway
    /// </summary>
    public class PaymentResultCode
    {
        /// <summary>
        /// The identify code
        /// </summary>
        public const string IDENTIFY = "Identify";
        
        /// <summary>
        /// The redirect code
        /// </summary>
        public const string REDIRECT = "Redirect";
        
        /// <summary>
        /// The challenge code
        /// </summary>
        public const string CHALLENGE = "Challenge";
        
        /// <summary>
        /// The Success code
        /// </summary>
        public const string SUCCESS = "Success";
    }
}
