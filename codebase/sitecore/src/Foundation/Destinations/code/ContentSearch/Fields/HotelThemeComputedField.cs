using easyJet.Foundation.Destinations.Models.Domain;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class HotelThemeComputedField : AccommodationComputedField
    {
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            ReferenceField hotelThemeField = indexableItem?.Item?.Fields[Constants.Fields.AccommodationItem.HotelTheme];
            if (hotelThemeField?.TargetItem != null)
            {
                var hotelTheme = new HotelTheme(hotelThemeField.TargetItem);
                return JsonConvert.SerializeObject(hotelTheme);
            }

            return null;
        }
    }
}