using System;
using System.Linq;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Services;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class VirtualFacilityGroupsContentResolver : RenderingContentsResolver
    {
        private readonly IVirtualFacilityGroupingService service;

        public VirtualFacilityGroupsContentResolver(IVirtualFacilityGroupingService service)
        {
            this.service = service;
        }

        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                var datasource = GetContextItem(rendering, renderingConfig)?
                    .GetChildren()
                    .FirstOrDefault(x => x.TemplateID.Equals(Constants.TemplateIds.AccommodationFacilitiesFolder));

                if (datasource == null)
                {
                    Log.Warn($"{nameof(VirtualFacilityGroupsContentResolver)} does not have facilities folder specified", this);
                    return null;
                }

                // Get accommodation facilities
                var facilities = datasource.GetChildren()
                 .Where(item => item.TemplateID == Constants.TemplateIds.AccommodationFacility)
                 .Select(AccommodationMapper.MapHotelFacilityFromItem)
                 .Where(item => item != null);

                // Get virtual facilities
                var facilityGroups = service.GetAllVirtualFacilities(datasource, true);

                return new { FacilitiesFolderId = datasource.ID.ToString(), VirtualFacilityGroups = service.MapFacilities(facilityGroups, facilities, datasource.Parent) };
            }
            catch (Exception e)
            {
                Log.Error($"{nameof(VirtualFacilityGroupsContentResolver)} cannot resolve content for facilities folder", e, this);
                return null;
            }
        }
    }
}