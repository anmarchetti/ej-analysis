using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Marketing
{
    public class UnsubscribeRequest
    {
        /// <summary>
        /// Email
        /// </summary>
        [EmailAddress]
        public string Email { get; set; }

        /// <summary>
        /// Encrypted email
        /// </summary>
        public string EncEmail { get; set; }

        /// <summary>
        /// source, like feefo or csat
        /// </summary>
        public string Source { get; set; }
    }
}