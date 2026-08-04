namespace easyJet.Holidays.Api.Domain.Data.Analytics
{
    /// <summary>
    /// Request analytis information
    /// </summary>
    public class RequestAnalytics
    {
        /// <summary>
        /// Session id
        /// </summary>
        public string SessionId { get; set; }

        /// <summary>
        /// User id
        /// </summary>
        public string UserId { get; set; }
    }
}
