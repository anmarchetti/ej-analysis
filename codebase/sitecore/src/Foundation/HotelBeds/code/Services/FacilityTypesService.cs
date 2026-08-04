using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;
using HotelBedsModels = easyJet.Foundation.HotelBeds.Models.Domain;

namespace easyJet.Foundation.HotelBeds.Services
{
    [Service(typeof(IFacilityTypesService), Lifetime = Lifetime.Singleton)]
    public class FacilityTypesService : IFacilityTypesService
    {
        private const string HotelBeds = "HBG";
        private const string Manually = "Manually";

        private readonly IVirtualFacilityGroupingService virtualFacilityGroupingService;
        private readonly IMasterDataService masterDataService;

        public FacilityTypesService(IVirtualFacilityGroupingService virtualFacilityGroupingService, IMasterDataService masterDataService)
        {
            this.virtualFacilityGroupingService = virtualFacilityGroupingService;
            this.masterDataService = masterDataService;
        }

        /// <inheritdoc/>
        public IEnumerable<HotelBedsModels.FacilityReportRow> ExportFacilityTypes(Item item)
        {
            var virtualFacilityGroups = virtualFacilityGroupingService.GetAllVirtualFacilities(item, true);

            var faciliyTypesFolderItem = item.Database.SelectSingleItem($"{item.Paths.FullPath}/*[@@templateid='{DestinationsConstants.TemplateIds.FacilityTypesFolder}']");

            var hotelBedsFacilities = masterDataService.GetFacilities();

            var rows = faciliyTypesFolderItem
                .GetDescendantsByTemplate(DestinationsConstants.TemplateIds.FacilityType)
                .Select(x => CreateFacilityReportRow(x, virtualFacilityGroups, hotelBedsFacilities));

            return rows;
        }

        /// <summary>
        /// Gets facility virtual group.
        /// </summary>
        /// <param name="virtualFacilityGroups">Virtual facility groups.</param>
        /// <param name="facilityTypesGroupId">Facility types group id.</param>
        /// <returns>Return facility virtual group name.</returns>
        private string GetFacilityVirtualGroupName(List<VirtualFacilityGroup> virtualFacilityGroups, ID facilityTypesGroupId)
        {
            var facilityVirualGroup = virtualFacilityGroups?.FirstOrDefault(v => v.FacilityGroupsIds.Contains(facilityTypesGroupId));
            return facilityVirualGroup?.Name ?? string.Empty;
        }

        /// <summary>
        /// Create facility report row model.
        /// </summary>
        /// <param name="facilityItem">Sitecore item.</param>
        /// <param name="virtualFacilityGroups">Virtual facility groups.</param>
        /// <param name="hotelBedsFacilities">Hotel beds facilities.</param>
        /// <returns>Object of FacilityReportRow.</returns>
        private HotelBedsModels.FacilityReportRow CreateFacilityReportRow(Item facilityItem, List<VirtualFacilityGroup> virtualFacilityGroups, IEnumerable<Models.Domain.Facility> hotelBedsFacilities)
        {
            var facilityCode = facilityItem[DestinationsConstants.Fields.DatasourceItem.Code];
            var groupCode = facilityItem.Parent[DestinationsConstants.Fields.DatasourceItem.Code];
            var source = hotelBedsFacilities.Any(x => x.FacilityGroupCode == groupCode && x.Code == facilityCode) ? HotelBeds : Manually;

            return new HotelBedsModels.FacilityReportRow(facilityItem, GetFacilityVirtualGroupName(virtualFacilityGroups, facilityItem.ParentID), source);
        }
    }
}