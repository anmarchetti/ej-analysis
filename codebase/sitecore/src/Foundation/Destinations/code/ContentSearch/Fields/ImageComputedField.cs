using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class ImageComputedField : BaseImageComputedField
    {
        protected override string ItemFieldName => Constants.Fields.SitecoreImageItem.Image;

        /// <inheritdoc />
        protected override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.IsDestinationItem();
        }
    }
}