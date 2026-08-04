using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Helpers
{
    public static class AccommodationFacilitiesProvider
    {
        public static List<HotelFacility> GetAccommodationFacilities(Item indexableItem, ID referenceTypeTemplateId, string referenceTypeFieldName)
        {
            var items = GetIndexableItemDescendants(indexableItem, referenceTypeTemplateId);

            var result = new List<HotelFacility>();
            foreach (var item in items.Where(i => i[Constants.Fields.BaseAppearance.ShowOnSite] == Constants.Common.CheckboxTrueValue))
            {
                var type = GetFacilityType(item, referenceTypeFieldName);

                // Add only available facilities to document (i.e. if ShowOnSite checked for facility and type)
                if (type != null && type[Constants.Fields.BaseAppearance.ShowOnSite] == Constants.Common.CheckboxTrueValue)
                {
                    result.Add(new HotelFacility(type, item));
                }
            }

            return result;
        }

        public static List<Item> GetIndexableItemDescendants(Item indexableItem, ID referenceTypeTemplateId)
        {
            var descendants = indexableItem.Axes.GetDescendants().Where(x => x.TemplateID.Equals(referenceTypeTemplateId)).ToList();
            return descendants;
        }

        private static Item GetFacilityType(Item item, string referenceTypeFieldName)
        {
            LookupField typeField = item.Fields[referenceTypeFieldName];
            var type = typeField?.TargetItem;
            return type;
        }
    }
}