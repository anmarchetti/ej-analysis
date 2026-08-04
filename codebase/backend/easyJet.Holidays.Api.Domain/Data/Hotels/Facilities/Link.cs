namespace easyJet.Holidays.Api.Domain.Data.Hotels.Facilities
{
    /// <summary>
    /// CMS link.
    /// </summary>
    public class Link
    {
        /// <summary>
        /// Anchor link.
        /// </summary>
        public string Anchor { get; set; }

        /// <summary>
        /// CMS link type.
        /// </summary>
        public string LinkType { get; set; }

        /// <summary>
        /// CMS link text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Link target.
        /// </summary>
        public string Target { get; set; }

        /// <summary>
        /// CMS link url.
        /// </summary>
        public string Url { get; set; }
    }
}
