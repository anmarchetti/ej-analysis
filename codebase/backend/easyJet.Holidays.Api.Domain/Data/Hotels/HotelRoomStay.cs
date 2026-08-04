using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;

namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Room stay configuration
    /// </summary>
    public class HotelRoomStay
    {
        /// <summary>
        /// Type
        /// </summary>
        public string StayType { get; set; }

        /// <summary>
        /// Description
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Configuration order
        /// </summary>
        public string Order { get; set; }

        /// <summary>
        /// Collection of facilities
        /// </summary>
        public IEnumerable<BaseFacility> Facilities { get; set; }
    }
}
