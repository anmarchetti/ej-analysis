namespace easyJet.Holidays.Api.Domain.Data.Hotels.Facilities
{
    /// <summary>
    /// Hotel room facility model
    /// </summary>
    public class RoomFacility : BaseFacility
    {
        /// <summary>
        /// Room facility date ranges (when facility is active)  
        /// </summary>
        public IEnumerable<SeasonalFacilityDateRange> SeasonalFacilitiesDataRange { get; set; }
    }

    /// <summary>
    /// Season facility data range
    /// </summary>
    public class SeasonalFacilityDateRange
    {
        public DateTime? Start { get; set; }

        public DateTime? End { get; set; }
    }
}
