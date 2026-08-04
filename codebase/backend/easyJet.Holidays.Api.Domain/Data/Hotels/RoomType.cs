using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Room type model for
    /// </summary>
    public class RoomType
    {
        /// <summary>
        /// room type code
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// room type Title
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// room type Full description
        /// </summary>
        public string Content { get; set; }

        /// <summary>
        /// room type short description
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Board type icon url
        /// </summary>
        public string IconUrl { get; set; }

        /// <summary>
        /// List of facilities, amenities and installations in the room 
        /// </summary>
        public IEnumerable<RoomFacility> Facilities { get; set; }

        /// <summary>
        /// Collection of room images
        /// </summary>
        public IEnumerable<HotelImage> Images { get; set; }

        /// <summary>
        /// Room additional configurations
        /// </summary>
        public IEnumerable<HotelRoomStay> Stays { get; set; }
        
        /// <summary>
        /// Room bed group details
        /// </summary>
        public IEnumerable<BedGroup> BedGroups { get; set; }

        /// <summary>
        /// object itemName
        /// </summary>
        public string ItemName { get; set; }
    }
}
