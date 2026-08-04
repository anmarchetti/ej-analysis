using easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class VideoThumbnailImageComputedField : BaseImageComputedField
    {
        protected override string ItemFieldName => Constants.Fields.AccommodationItem.VideoPlaceholder;

        /// <inheritdoc />
        protected override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID == Constants.TemplateIds.Accommodation;
        }
    }
}