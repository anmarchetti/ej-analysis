using System;
using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;

namespace easyJet.Foundation.HotelBeds.Services
{
    public interface IMasterDataService
    {
        IEnumerable<Accommodation> GetAccommodations(string[] hotelCodes, string language = null, DateTime? lastUpdateTime = null);

        Accommodation GetAccommodation(string hotelCode, string language = null, DateTime? lastUpdateTime = null);

        IEnumerable<FacilityTypology> GetFacilityTypologies(DateTime? lastUpdateTime = null);

        IEnumerable<FacilityGroup> GetFacilityGroups(string[] facilityGroupsCodes = null, DateTime? lastUpdateTime = null);

        IEnumerable<Facility> GetFacilities(DateTime? lastUpdateTime = null);

        /// <summary>
        /// Get all room types from HotelBeds.
        /// </summary>
        /// <param name="lastUpdateTime">Last time when sync was run.</param>
        /// <returns>Collection of room types.</returns>
        List<RoomType> GetRoomTypes(DateTime? lastUpdateTime = null);
    }
}