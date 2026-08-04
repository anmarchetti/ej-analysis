namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    /// <summary>
    /// Single day availability record
    /// </summary>
    public struct SingleDayAvailability
    {
        /// <summary>
        ///  Date yyyy-MM-dd
        /// </summary>
        public string Date { get; set; }

        /// <summary>
        /// if outbound flights available
        /// </summary>
        public bool Out { get; set; }

        /// <summary>
        /// if inbound flights avaialble
        /// </summary>
        public bool In { get; set; }
    }
}
