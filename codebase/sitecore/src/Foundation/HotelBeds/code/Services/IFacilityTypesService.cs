using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Services
{
    public interface IFacilityTypesService
    {
        /// <summary>
        /// Get export rows by all facility types.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Collection of facility report rows.</returns>
        IEnumerable<FacilityReportRow> ExportFacilityTypes(Item item);
    }
}
