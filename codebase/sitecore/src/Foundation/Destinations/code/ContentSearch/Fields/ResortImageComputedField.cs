using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class ResortImageComputedField : AccommodationComputedField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            Item resortItem = indexableItem?.Item?.Parent;
            if (resortItem != null && resortItem.Template.ID.Equals(Constants.TemplateIds.Resort))
            {
                return resortItem?.GetMediaUrl(Constants.Fields.SitecoreImageItem.Image);
            }

            return null;
        }
    }
}