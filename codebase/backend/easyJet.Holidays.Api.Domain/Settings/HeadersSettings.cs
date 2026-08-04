namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Headers settings model
    /// </summary>
    public class HeadersSettings
    {
        /// <summary>
        /// Idempotency Key header name
        /// </summary>
        public string IdempotencyKey { get; set; }

        /// <summary>
        /// True IP address header passed to origin by Akamai
        /// </summary>
        public string TrueIpAddress { get; set; }

        /// <summary>
        /// Name for the EJ Session Header
        /// </summary>
        public string EJSessionHeader { get; set; }
    }
}
