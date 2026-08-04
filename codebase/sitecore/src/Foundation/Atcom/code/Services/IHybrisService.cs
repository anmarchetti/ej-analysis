using System.Collections.Generic;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.Atcom.Models.Domain;

namespace easyJet.Foundation.Atcom.Services
{
    public interface IHybrisService
    {
        /// <summary>
        /// Get Accommodation's Room Types.
        /// </summary>
        /// <returns>Collection of accommodation's room types where 'key' - accom code and 'value' - collection of room types with seasonal facilities.</returns>
        Dictionary<string, List<RoomTypeFacilities>> GetAccommodationRoomTypes();

        /// <summary>
        /// Get Room Type Facilities.
        /// </summary>
        /// <returns>Collection of room type facilities.</returns>
        List<DataObject> GetRoomTypeFacilities();
    }
}