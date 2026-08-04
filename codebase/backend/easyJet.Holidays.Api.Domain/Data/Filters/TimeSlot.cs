namespace easyJet.Holidays.Api.Domain.Data.Filters
{
    public class TimeSlot
    {
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
        public string AtcomCode { get; set; }
        /// <summary>
        /// Gets or sets tracking id
        /// </summary>
        public string TrackingId { get; set; }
    }
}