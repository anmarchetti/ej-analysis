using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IHotelFacilitiesService
    {
        /// <summary>
        /// Gets dictionary of hotel facilities where key - hotel code, value - collection of hotel facilities.
        /// </summary>
        /// <param name="ids">Ids of hotels.</param>
        /// <returns>Hotels facilities.</returns>
        Dictionary<string, List<FacilityType>> GetHotelsFacilities(string[] ids);

        void Create(Item parentItem, List<FacilityContent> facilities, ID facilitiesFolderTemplateId, ID facilityItemTemplateId);

        void Upsert(Item parentItem, List<FacilityContent> facilities, ID facilitiesFolderTemplateId, ID facilityItemTemplateId);
    }
}
