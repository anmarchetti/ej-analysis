using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class HotelUrlComputedField : AccommodationComputedField
    {
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            if (indexableItem?.Item?.GetSiteInfo() != null)
            {
                var item = indexableItem?.Item;
                return item?.GetItemUrl(item?.GetSiteContext()?.Name).Replace("/destinations", string.Empty);
            }

            return null;
        }
    }
}
