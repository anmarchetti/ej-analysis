using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class ResortDescriptionComputedField : AccommodationComputedField
    {
        private readonly ICustomCacheRepository cache;

        public ResortDescriptionComputedField()
        {
            cache = new CustomCacheRepository();
        }

        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            Item resortItem = indexableItem?.Item?.Parent;
            if (resortItem != null && resortItem.Template.ID.Equals(Constants.TemplateIds.Resort))
            {
                var cacheKey = $"ResortDescription-{resortItem.ID}-{indexableItem.Culture}";
                var data = cache.GetItem<string>(cacheKey);

                if (data != null)
                {
                    return data;
                }

                var description = resortItem.Axes.SelectSingleItem(resortItem.QuerySafePath() +
                                                      $"/*[@@templateid='{Constants.TemplateIds.PageComponentsFolder}']/*[@@templateid='{Constants.TemplateIds.DestinationInfoBlocksFolder}']/*[@@templateid='{Constants.TemplateIds.DestinationInfoBlock}']")?[Constants.Fields.DestinationInfoBlock.Description];

                if (!string.IsNullOrEmpty(description))
                {
                    cache.StoreItem(cacheKey, description);
                }

                return description;
            }

            return null;
        }
    }
}