using easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class IconComputedField : BaseImageComputedField
    {
        protected override string ItemFieldName => Constants.Fields.SitecoreIconItem.Icon;

        /// <inheritdoc/>
        protected override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.BoardType);
        }
    }
}