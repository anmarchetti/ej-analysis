namespace easyJet.Holidays.Api.Domain.Data.AirportParking
{
    /// <summary>
    /// All necessary information regarding the airport parking that the UI needs.
    /// </summary>
    public class AirportParkingResponse
    {
        /// <summary>
        /// All airport parking items
        /// </summary>
        public IList<AirportParkingItem> AirportParkingItems { get; } = new List<AirportParkingItem>();
    }
}