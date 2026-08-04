using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Utilities;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.SitecoreExtensions.Cache.Providers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IVirtualFacilityGroupingService), Lifetime = Lifetime.Singleton)]
    public class VirtualFacilityGroupingService : IVirtualFacilityGroupingService
    {
        private const string CacheKey = "Desinations.Cache.VirtualFacilities";

        private readonly int cacheExpiration = Sitecore.Configuration.Settings.GetIntSetting("Destinations.VirtualFacilities.CacheExpiredInMinutes", 10);

        /// <inheritdoc/>
        public List<AccommodationFacilityVirtualGroup> MapFacilities(
            IEnumerable<VirtualFacilityGroup> virtualGroups,
            IEnumerable<HotelFacility> accommodationFacilities,
            Item hotelItem)
        {
            var result = new List<AccommodationFacilityVirtualGroup>();
            if (accommodationFacilities.Any())
            {
                virtualGroups = virtualGroups.Where(x => x != null);
                foreach (var virtualGroup in virtualGroups)
                {
                    // Grouping accommodation facilities in virtual group by facility group code and facility code
                    var query = from facilities in virtualGroup.Facilities
                                join accommodationFacility in accommodationFacilities
                                on facilities.GroupCode equals accommodationFacility.FacilityGroupCode
                                where facilities.Code == accommodationFacility.FacilityCode
                                select MapHotelFacilityFromFacilityType(accommodationFacility, facilities);

                    var isFoodAndDrink = virtualGroup.TemplateId == Constants.TemplateIds.FoodAndDrinkFacilityVirtualGrouping;
                    var isFamilyFacility = virtualGroup.TemplateId == Constants.TemplateIds.FamilyFacilityVirtualGrouping;

                    if (query.Any() || isFoodAndDrink || isFamilyFacility)
                    {
                        // Distinct duplicates
                        var mergedFacilities = query.GroupBy(x => new { x.FacilityGroupCode, x.FacilityCode })
                                             .Select(x => x.First()).OrderBy(x => x.SortOrder).ToList();

                        var hotelVirtualFacility = MapHotelVirtualFacility(hotelItem, virtualGroup, mergedFacilities);

                        if (isFamilyFacility && string.IsNullOrEmpty(hotelVirtualFacility.Description))
                        {
                            continue;
                        }

                        if (isFoodAndDrink && string.IsNullOrEmpty(hotelVirtualFacility.Description) && !hotelVirtualFacility.Items.Any())
                        {
                            continue;
                        }

                        result.Add(hotelVirtualFacility);
                    }
                }
            }

            return result;
        }

        /// <inheritdoc/>
        public List<VirtualFacilityGroup> GetAllVirtualFacilities(Item item, bool doNotUseCaching = false)
        {
            // disable caching for content resolver;
            if (doNotUseCaching)
            {
                return GetVirtualFacilities(item);
            }

            string cacheKey = $"Destinations.Cache.VirtualFacilities-{item.Language.Name}";
            var virtualFacilityGroups = CustomCacheProvider.GetCacheObject<List<VirtualFacilityGroup>>(cacheKey);
            if (virtualFacilityGroups != null)
            {
                return virtualFacilityGroups;
            }

            virtualFacilityGroups = GetVirtualFacilities(item);

            if (virtualFacilityGroups.Any())
            {
                CustomCacheProvider.SetCacheObject(CacheKey, virtualFacilityGroups, cacheExpiration);
            }

            return virtualFacilityGroups;
        }

        /// <inheritdoc/>
        public string GetVirtualFacilityGroupId(ID facilityId)
        {
            Item facility = Sitecore.Context.Database?.GetItem(facilityId);
            MultilistField facilityTypeField = facility?.Fields[Constants.Fields.BaseFacilityItem.FacilityType];

            var facilityType = facilityTypeField?.GetItems().FirstOrDefault();

            var facilityTypesGroup = facilityType?.GetAncestorByBaseTemplateId(Constants.TemplateIds.FacilityTypesGroup);

            if (facilityTypesGroup != null)
            {
                var virtualFacilityGroups = GetAllVirtualFacilities(facilityTypesGroup, true);

                return virtualFacilityGroups?.FirstOrDefault(v => v.FacilityGroupsIds.Contains(facilityTypesGroup.ID))?.Id;
            }

            return null;
        }

        /// <summary>
        /// Get virtual facilities.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Collection of virtual facilities.</returns>
        private List<VirtualFacilityGroup> GetVirtualFacilities(Item item)
        {
            var dataFolder = item.GetDataFolderQuery();
            Item facilityVirtualFolder = item.Database.SelectSingleItem($"{dataFolder}/*[@@templateid = '{Constants.TemplateIds.FacilityVirtualGroupingFolder}']");

            if (facilityVirtualFolder?.Children == null)
            {
                return new List<VirtualFacilityGroup>();
            }

            return facilityVirtualFolder.Children
                .Select(x => MapVirtualFacilityGroup(x)).ToList();
        }

        /// <summary>
        /// Map facility type to hotel facility.
        /// </summary>
        /// <param name="hotelFacility">Hotel facility.</param>
        /// <param name="facilityType">Facility type.</param>
        /// <returns>Mapped hotel facility.</returns>
        private HotelFacility MapHotelFacilityFromFacilityType(HotelFacility hotelFacility, Facility facilityType)
        {
            hotelFacility.Icon = facilityType.Icon;
            hotelFacility.Tooltip = facilityType.ToolTip;
            return hotelFacility;
        }

        /// <summary>
        /// Map virtual facility group by template.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Mapped virtual facility group.</returns>
        private VirtualFacilityGroup MapVirtualFacilityGroup(Item item)
        {
            var virtualFacilityGroup = new VirtualFacilityGroup(item);
            if (item.TemplateID == Constants.TemplateIds.OverviewFacilityVirtualGrouping)
            {
                virtualFacilityGroup.Title = item[Constants.Fields.OverviewFacilityVirtualGrouping.Title];
                var facilities = item.GetItems(Constants.Fields.OverviewFacilityVirtualGrouping.TopFacilities);
                virtualFacilityGroup.Facilities = facilities.Select(x => new Facility(x)).ToList();
                virtualFacilityGroup.FacilityGroupsIds = facilities.Select(x => x.ParentID).ToList();
            }
            else
            {
                var facilityGroups = item.GetItems(Constants.Fields.FacilityVirtualGrouping.FacilityGroups);

                if (facilityGroups != null)
                {
                    virtualFacilityGroup.FacilityGroupsIds = facilityGroups.Select(x => x.ID).ToList();

                    virtualFacilityGroup.Facilities = facilityGroups
                        .SelectMany(x => x.Children.Select(y => new Facility(y)))
                        .ToList();
                }
            }

            return virtualFacilityGroup;
        }

        /// <summary>
        /// Map virtual facility to hotel virtual facility.
        /// </summary>
        /// <param name="hotelItem">Hotel item.</param>
        /// <param name="virtualFacilityGroup">Virtual facility group.</param>
        /// <param name="hotelFacilities">Hotel Facilities.</param>
        /// <returns>Hotel virtual facility.</returns>
        private AccommodationFacilityVirtualGroup MapHotelVirtualFacility(Item hotelItem, VirtualFacilityGroup virtualFacilityGroup, List<HotelFacility> hotelFacilities)
        {
            var accommodationFacilityVirtualGroup = new AccommodationFacilityVirtualGroup()
            {
                Code = virtualFacilityGroup.Code,
                Name = virtualFacilityGroup.Name,
                Title = virtualFacilityGroup.Title,
                Id = virtualFacilityGroup.Id,
                IconUrl = virtualFacilityGroup.IconUrl,
                Items = hotelFacilities
            };

            if (virtualFacilityGroup.TemplateId == Constants.TemplateIds.OverviewFacilityVirtualGrouping)
            {
                accommodationFacilityVirtualGroup.Description = hotelItem[Constants.Fields.AccommodationItem.OverviewDescription];
            }
            else if (virtualFacilityGroup.TemplateId == Constants.TemplateIds.FoodAndDrinkFacilityVirtualGrouping)
            {
                InitFacilityVirtualGroup(hotelItem.Children.FirstOrDefault(x => x.TemplateID == Constants.TemplateIds.FoodAndDrinkFacilityRichTextTab), accommodationFacilityVirtualGroup);
            }
            else if (virtualFacilityGroup.TemplateId == Constants.TemplateIds.FamilyFacilityVirtualGrouping)
            {
                InitFacilityVirtualGroup(hotelItem.Children.FirstOrDefault(x => x.TemplateID == Constants.TemplateIds.FamilyFacilityRichTextTab), accommodationFacilityVirtualGroup);
            }

            return accommodationFacilityVirtualGroup;
        }

        private void InitFacilityVirtualGroup(Item facilityTab, AccommodationFacilityVirtualGroup accommodationFacilityVirtualGroup)
        {
            if (facilityTab != null)
            {
                accommodationFacilityVirtualGroup.Description = facilityTab[Constants.Fields.FacilityRichTextTab.Description];
                accommodationFacilityVirtualGroup.Image = new ImageUtils().GetChildImages(facilityTab)?.FirstOrDefault();
            }
        }
    }
}