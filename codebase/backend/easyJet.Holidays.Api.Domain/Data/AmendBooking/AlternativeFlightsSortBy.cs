namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    /// <summary>
    /// Enum to indicate by which property the stratgy performs sorting
    /// </summary>
    public enum AlternativeFlightsSortBy
    {
        /// <summary>
        /// Price low to high
        /// </summary>
        PRICEASC,

        /// <summary>
        /// Price high to low
        /// </summary>
        PRICEDESC,

        /// <summary>
        /// Sort by departure time
        /// </summary>
        OUTBOUND,

        /// <summary>
        /// Sort by arrival time
        /// </summary>
        INBOUND
    }
}
