using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IVirtualFacilityGroupingService
    {
        /// <summary>
        /// Map accommodation facility to virtual facility group by facility group code and facility code.
        /// </summary>
        /// <param name="virtualGroups">Collections of Virtual Facility Group.</param>
        /// <param name="accommodationFacilities">Collections of  Accommodation Facility.</param>
        /// <param name="hotelItem">Sitecore hotel item.</param>
        /// <returns>Collection of virtual group of accommodation facility.</returns>
        List<AccommodationFacilityVirtualGroup> MapFacilities(IEnumerable<VirtualFacilityGroup> virtualGroups, IEnumerable<HotelFacility> accommodationFacilities, Item hotelItem);

        /// <summary>
        /// Gets all items under Facility Virtual Group folder.
        /// </summary>
        /// <param name="indexableitem">item from index.</param>
        /// <param name="doNotUseCaching">defines if data should be cached.</param>
        /// <returns>Collection of virtual facilities group.</returns>
        List<VirtualFacilityGroup> GetAllVirtualFacilities(Item indexableitem, bool doNotUseCaching = false);

        /// <summary>
        /// Get virtualFacilityGroup id by facility Id.
        /// </summary>
        /// <param name="facilityId">Accomodation facility id.</param>
        /// <returns>VirtualFacilityGroup item's id.</returns>
        string GetVirtualFacilityGroupId(ID facilityId);
    }
}
