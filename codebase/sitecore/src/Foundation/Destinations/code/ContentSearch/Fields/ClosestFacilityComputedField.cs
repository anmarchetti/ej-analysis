using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.Destinations.Models.Domain;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    /// <summary>
    /// Represents Closest Facility (Distance in meters)
    /// Facility where Distance field not empty and has minimum value.
    /// </summary>
    public class ClosestFacilityComputedField : AccommodationComputedField
    {
        // the number of mapping parameters, where the first is the name of the hotel theme, and the second is the name of the type of facility
        private const int CountOfMappingParams = 2;

        /// <summary>
        /// Cumpute Closest Facility data.
        /// </summary>
        /// <param name="indexableItem">Indexable Item.</param>
        /// <returns>Facility Object in JSON format.</returns>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            Item item = null;
            LookupField hoteltheme = indexableItem?.Item?.Fields[Constants.Fields.AccommodationItem.HotelTheme];
            if (hoteltheme?.TargetItem != null)
            {
                var closestFacilityByHotelTheme = GetClosestFacilityByHotelThemeMaping();
                var hotelThemeName = hoteltheme?.TargetItem.Name;
                item = GetClosestFacilityByHotelTheme(indexableItem.Item, hotelThemeName, closestFacilityByHotelTheme);
            }

            LookupField typeField = item?.Fields[Constants.Fields.BaseFacilityItem.FacilityType];
            var type = typeField?.TargetItem;

            return item != null && type != null ?
                JsonConvert.SerializeObject(new HotelFacility(type, item), new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore }) :
                null;
        }

        private Dictionary<string, string> GetClosestFacilityByHotelThemeMaping()
        {
            return Sitecore.Configuration.Settings.GetSetting("Destinations.ClosestFacilityByHotelThemeMaping")
                .Split('|')
                .Select(x => x.Split(','))
                .Where(x => x.Length >= CountOfMappingParams)
                .ToDictionary(x => x[0], x => x[1]);
        }

        private Item GetClosestFacilityByHotelTheme(Item item, string hotelThemeName, Dictionary<string, string> closestFacilityByHotelTheme)
        {
            return item.GetAccommodationReferences(Constants.AccommodationReferences.Facilities)
                .FirstOrDefault(x => !string.IsNullOrWhiteSpace(x[Constants.Fields.AccommodationFacilityItem.Distance]) &&
                                     IsValid(x, hotelThemeName, closestFacilityByHotelTheme));
        }

        private bool IsValid(Item item, string themeName, Dictionary<string, string> closestFacilityByHotelTheme)
        {
            LookupField typeField = item?.Fields[Constants.Fields.BaseFacilityItem.FacilityType];
            var type = typeField?.TargetItem;

            return closestFacilityByHotelTheme.TryGetValue(themeName, out var typeName) && typeName.Equals(type?.Name, StringComparison.InvariantCultureIgnoreCase);
        }
    }
}