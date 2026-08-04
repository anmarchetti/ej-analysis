using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Authentication
{
    /// <summary>
    /// Customer registration request
    /// </summary>
    public class CustomerRegistrationRequest
    {
        /// <summary>
        /// Customer details
        /// </summary>
        [Required]
        public CustomerDetails Customer { get; set; }

        /// <summary>
        /// Customer account password. Must not include the special characters &#35;, &amp; + or space.
        /// </summary>
        [Required]
        [StringLength(20, MinimumLength = 10)]
        [RegularExpression(@"^(?=[^0])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[^#&=+ ]*$", ErrorMessage = "The field {0} must not include the special characters # & + or space.")]
        public string Password { get; set; }

        /// <summary>
        /// Login: whether remember user or not (hard vs soft login). Won't be safed in profile
        /// </summary>
        public bool RememberMe { get; set; }
    }
}
