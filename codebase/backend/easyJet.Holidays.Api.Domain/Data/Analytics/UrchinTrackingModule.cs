namespace easyJet.Holidays.Api.Domain.Data.Analytics
{
    /// <summary>
    /// UTM parameters in a URL identify the marketing campaign that refers traffic to a specific website.
    /// </summary>
    public class UrchinTrackingModule
    {
        /// <summary>
        /// Identifies which site sent the traffic, and is a required parameter.
        /// </summary>
        public string Utm_source { get; set; }

        /// <summary>
        /// Identifies what type of link was used, such as cost per click or email.
        /// </summary>
        public string Utm_medium { get; set; }

        /// <summary>
        /// Identifies a specific product promotion or strategic campaign.
        /// </summary>
        public string Utm_campaign { get; set; }

        /// <summary>
        /// Identifies search terms.
        /// </summary>
        public string Utm_term { get; set; }

        /// <summary>
        /// 	Identifies what specifically was clicked to bring the user to the site, such as a banner ad or a text link. It is often used for A/B testing and content-targeted ads.
        /// </summary>
        public string Utm_content { get; set; }
    }
}
