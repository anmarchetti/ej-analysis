using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Authentication
{
    /// <summary>
    /// Login API request body model
    /// </summary>
    public class LogInRequestBody
    {
        /// <summary>
        /// Email 
        /// </summary>
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        /// <summary>
        /// Password. Must not include the special characters &#35; &amp; + or space.
        /// </summary>
        [Required]
        public string Password { get; set; }

        /// <summary>
        /// Whether remember user or not (hard vs soft login)
        /// </summary>
        public bool RememberMe { get; set; }

        /// <summary>
        /// The user's CAPTCHA token
        /// </summary>
        public string Captcha { get; set; }

        /// <summary>
        /// Disable tracking, false by default
        /// </summary>
        public bool DisableTracking { get; set; } = false;
    }
}
