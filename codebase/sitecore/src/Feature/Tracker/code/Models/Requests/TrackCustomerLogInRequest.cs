namespace easyJet.Feature.Tracker.Models.Requests
{
    public class TrackCustomerLogInRequest
    {
        /// <summary>
        /// Gets or sets email.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Gets or sets id.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets Unique Customer Identification.
        /// </summary>
        public string Ucid { get; set; }

        /// <summary>
        /// Gets or sets first name.
        /// </summary>
        public string FirstName { get; set; }

        /// <summary>
        /// Gets or sets last name.
        /// </summary>
        public string LastName { get; set; }

        /// <summary>
        /// Gets or sets title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets mobile phone code.
        /// </summary>
        public string MobilePhoneCode { get; set; }

        /// <summary>
        /// Gets or sets mobile phone number.
        /// </summary>
        public string MobilePhoneNumber { get; set; }

        /// <summary>
        /// Gets or sets user marketing preferences.
        /// </summary>
        public MarketingPreferences MarketingPreferences { get; set; }
    }
}