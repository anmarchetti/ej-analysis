using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields
{
    public abstract class BaseImageComputedField : BaseComputedIndexField
    {
        protected internal abstract string ItemFieldName { get; }

        /// <inheritdoc />
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.GetMediaUrl(ItemFieldName);
        }
    }
}