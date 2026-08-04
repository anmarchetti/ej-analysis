namespace easyJet.Holidays.Api.Domain.Data.PackageOffers
{
    /// <summary>
    /// Fetch destinations recommendations request
    /// </summary>
    public class DestinationsRecommendationRequest
    {
        /// <summary>
        /// Market code
        /// </summary>
        public string MarketCode { get; set; }
        /// <summary>
        /// Travel origin
        /// </summary>
        public IEnumerable<string> Origin { get; set; }
        /// <summary>
        /// Number of adults
        /// </summary>
        public int? Adults { get; set; }
        /// <summary>
        /// Number of infants
        /// </summary>
        public int? Infants { get; set; }
        /// <summary>
        /// Collection of children ages
        /// </summary>
        public IEnumerable<int> ChildAges { get; set; }
        /// <summary>
        /// Collection of tags
        /// </summary>
        public IEnumerable<string> Tags { get; set; }
        /// <summary>
        /// Travel period start date
        /// </summary>
        public string PeriodFrom { get; set; }
        /// <summary>
        /// Travel period end date
        /// </summary>
        public string PeriodTo { get; set; }

    }
}
