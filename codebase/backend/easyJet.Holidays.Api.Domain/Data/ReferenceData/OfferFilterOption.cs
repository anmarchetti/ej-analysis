namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    [Serializable]
    public class OfferFilterOption
    {
        public string Code { get; set; }
        public string Name { get; set; }
        /// <summary>
        /// Gets or sets tracking id
        /// </summary>
        public string TrackingId { get; set; }
        public bool Enabled { get; set; }
        public string Value { get; set; }
    }
}