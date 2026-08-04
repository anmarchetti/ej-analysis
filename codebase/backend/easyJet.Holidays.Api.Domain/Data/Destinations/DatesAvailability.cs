namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    /// <summary>
    /// Dates availability info
    /// </summary>
    public class DatesAvailability
    {
        /// <summary>
        /// dates availability list
        /// </summary>
        public List<SingleDayAvailability> Dates { get; set; }

        /// <summary>
        /// next available for outbound flight date
        /// </summary>
        public DateTime NextAvailableDate { get; set; }

        /// <summary>
        /// last available for outbound flight date
        /// </summary>
        public DateTime LastAvailableDate { get; set; }
    }
}
