namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class UserCountry
    {
        public string Name { get; set; }

        public string Code { get; set; }

        public string Iso2 { get; set; }

        /// <summary>
        /// Gets or sets the tracking id
        /// </summary>
        public string TrackingId { get; set; }
    }
}