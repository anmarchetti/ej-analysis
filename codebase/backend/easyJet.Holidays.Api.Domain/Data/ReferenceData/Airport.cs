namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    /// <summary>
    /// Data model for Airport from CMS (reference data)
    /// </summary>
    public class Airport
    {
        /// <summary>
        /// Airport code, e.g. LTN
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Airport name, e.g. Luton
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Airport item name
        /// </summary>
        public string ItemName { get; set; }

        /// <summary>
        /// Airport closest parent - Resort or City or Country, e.g. London (market group) or Aya Napa (resort), or United Kingdom (country, when no market group available)
        /// </summary>
        public string AirportGroup { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        /// <summary>
        /// Gets or sets tracking id
        /// </summary>
        public string TrackingId { get; set; }
    }
}
