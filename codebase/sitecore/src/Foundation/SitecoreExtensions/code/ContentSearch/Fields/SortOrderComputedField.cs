using Sitecore.ContentSearch;

namespace easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields
{
    public class SortOrderComputedField : BaseComputedIndexField
    {
        private const int DefaultSortOrderValue = 100;

        /// <inheritdoc />
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var item = indexableItem.Item;
            if (item == null)
            {
                return null;
            }

            if (string.IsNullOrEmpty(item[Sitecore.FieldIDs.Sortorder]))
            {
                return DefaultSortOrderValue;
            }

            return int.TryParse(item[Sitecore.FieldIDs.Sortorder], out int sortOrder)
                ? sortOrder
                : DefaultSortOrderValue;
        }

        /// <inheritdoc />
        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return true;
        }
    }
}
