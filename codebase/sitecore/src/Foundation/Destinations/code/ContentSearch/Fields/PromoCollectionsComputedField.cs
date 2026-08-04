using System.Linq;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class PromoCollectionsComputedField : AccommodationComputedField
    {
        /// <summary>
        /// Selected Promo Collections Keys.
        /// </summary>
        /// <param name="indexableItem">indexableItem</param>
        /// <returns>string or null</returns>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            MultilistField multilist = indexableItem.Item.Fields[Constants.Fields.AccommodationItem.PromoCollections];

            var items = multilist?.GetItems()?
                    .Select(x => x?.Fields[Constants.Fields.PromotionCollectionItem.Key]?.Value)
                    .Where(x => !string.IsNullOrEmpty(x));

            if (items != null && items.Any())
            {
                return items;
            }

            return null;
        }
    }
}