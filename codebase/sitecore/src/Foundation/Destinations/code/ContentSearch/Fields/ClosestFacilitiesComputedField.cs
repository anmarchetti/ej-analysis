using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class ClosestFacilitiesComputedField : AccommodationComputedField
    {
        // the number of mapping parameters, where the first is the name of the hotel theme, and the second is the name of the type of facility
        private const int CountOfMappingParams = 2;
        private const string CacheKey = "Destinations.Cache.HotelThemes";
        private static readonly string ClosestFacilityByHotelThemeMaping = Sitecore.Configuration.Settings.GetSetting("Destinations.ClosestFacilityByHotelThemeMaping");

        private readonly ICustomCacheRepository cache;

        public ClosestFacilitiesComputedField()
        {
            cache = new CustomCacheRepository();
        }

        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var result = new Dictionary<string, HotelFacility>();
            if (indexableItem?.Item != null)
            {
                var closestFacilities = GetClosestFacilities(indexableItem.Item, HotelTypes);
                var themes = GetHotelThemes(indexableItem.Item);

                foreach (var closestFacility in closestFacilities)
                {
                    LookupField typeField = closestFacility.Value.Fields[Constants.Fields.BaseFacilityItem.FacilityType];
                    var type = typeField?.TargetItem;

                    if (type != null)
                    {
                        if (themes.TryGetValue(closestFacility.Key, out string themeCode))
                        {
                            result[themeCode] = new HotelFacility(type, closestFacility.Value);
                        }
                    }
                }
            }

            return JsonConvert.SerializeObject(result, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
        }

        // Refactor that
        private Dictionary<string, Item> GetClosestFacilities(Item accommodationItem, Dictionary<string, string> hotelTypes)
        {
            var result = new Dictionary<string, Item>();
            var facilities = accommodationItem.GetAccommodationReferences(Constants.AccommodationReferences.Facilities);
            foreach (var hotelType in hotelTypes)
            {
                var typeItem = facilities
                    .FirstOrDefault(x => !string.IsNullOrWhiteSpace(x[Constants.Fields.AccommodationFacilityItem.Distance]) && IsValid(x, hotelType.Value));

                if (typeItem != null)
                {
                    result[hotelType.Key] = typeItem;
                }
            }

            return result;
        }

        private bool IsValid(Item item, string hotelType)
        {
            LookupField typeField = item.Fields[Constants.Fields.BaseFacilityItem.FacilityType];
            var type = typeField?.TargetItem;

            return hotelType.Equals(type?.Name, StringComparison.InvariantCultureIgnoreCase);
        }

        private Dictionary<string, string> GetHotelThemes(Item item)
        {
            var data = cache.GetItem<Dictionary<string, string>>(CacheKey);

            if (data != null)
            {
                return data;
            }

            var hotelThemesFolderItem = item.Database.SelectSingleItem($"{item.GetSiteInfo().RootPath}/Data/*[@@templateId='{Constants.TemplateIds.HotelThemesFolder}']");
            var hotelThemes = hotelThemesFolderItem != null ?
                    hotelThemesFolderItem?.GetChildren().Where(x => x.TemplateID == Constants.TemplateIds.HotelTheme).Select(hotelTheme => new HotelThemeResponseItem(hotelTheme))?.GroupBy(x => x.Name)
                    .ToDictionary(x => x.Key, y => y.FirstOrDefault()?.Code) :
                        new Dictionary<string, string>();

            if (hotelThemes.Any())
            {
                cache.StoreItem(CacheKey, hotelThemes);
            }

            return hotelThemes;
        }

        private static Dictionary<string, string> HotelTypes =>
            ClosestFacilityByHotelThemeMaping
            .Split('|')
            .Select(x => x.Split(','))
            .Where(x => x.Length >= CountOfMappingParams)
            .ToDictionary(x => x[0], x => x[1]);
    }
}