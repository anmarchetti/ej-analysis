namespace easyJet.Holidays.Api.Domain.Mappers
{
    /// <summary>
    /// Map different properties based on the type of change performed
    /// </summary>
    public enum AmendFlightSearchRequestMapType
    {
        /// <summary>
        /// Map type for flight change
        /// </summary>
        Flight,
        /// <summary>
        /// Map type for room and board changes
        /// </summary>
        RoomAndBoard
    }
}
