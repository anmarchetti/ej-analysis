using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Settings for contact us form.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class ContactUsSettings
    {
        /// <summary>
        /// The max size of all files in the request form
        /// </summary>
        public int RequestFormAttachmentMaxSizeOfAllFiles { get; set; }

        /// <summary>
        /// All allowed file extension in the request form
        /// </summary>
        public string[] RequestFormAttachmentAllowedExtensions { get; set; }

        /// <summary>
        /// Enabled ReCAPTCHA on Request Form
        /// </summary>
        public bool RequestFormEnableRecaptcha { get; set; }
        
        /// <summary>
        /// Past booking state value
        /// </summary>
        public string PastBookingState { get; set; } = "Past";
        
        /// <summary>
        /// Future booking state value
        /// </summary>
        public string FutureBookingState { get; set; } = "Future";
    }
}