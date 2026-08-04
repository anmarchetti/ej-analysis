using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IFacilityHeadersService
    {
        /// <summary>
        /// Get facility headers.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Collection of facility headers.</returns>
        List<FacilityHeader> GetFacilityHeaders(Item item);

        /// <summary>
        /// Map facility headers related with accommodation facilities.
        /// </summary>
        /// <param name="facilityHeaders">Facility headers.</param>
        /// <param name="accommodationFacilities">Accommodation facilities.</param>
        /// <returns>Collection of mapped facility headers.</returns>
        List<FacilityHeader> MapFacilityHeaders(IEnumerable<FacilityHeader> facilityHeaders, IEnumerable<FacilityFilteredType> accommodationFacilities);
    }
}
