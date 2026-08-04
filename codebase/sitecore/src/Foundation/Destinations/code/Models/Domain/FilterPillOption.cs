namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FilterPillOption
    {
        /// <summary>
        /// Gets or sets source filter this filter pill points to.
        /// </summary>
        public string FilterCode { get; set; }

        /// <summary>
        /// Gets or sets source option code (or composite code for special cases).
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Gets or sets display name for the filter pill.
        /// </summary>
        public string Name { get; set; }
    }
}
