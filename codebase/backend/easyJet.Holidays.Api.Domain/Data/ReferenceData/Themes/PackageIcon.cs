namespace easyJet.Holidays.Api.Domain.Data.ReferenceData.Themes
{
    /// <summary>
    /// Package icon reference
    /// </summary>
    public class PackageIcon
    {
        /// <summary>
        /// Icon key
        /// </summary>
        public string Key { get; set; }

        /// <summary>
        /// Url to access the image
        /// </summary>
        public string IconUrl { get; set; }

        /// <summary>
        /// Icon name
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Icon luggage code
        /// </summary>
        public string LuggageCode { get; set; }
    }
}
