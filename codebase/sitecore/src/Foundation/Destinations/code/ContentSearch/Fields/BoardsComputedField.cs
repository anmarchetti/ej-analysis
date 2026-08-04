using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class BoardsComputedField : AccommodationReferenceComputedField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            return ComputeReference(indexableItem.Item, Constants.AccommodationReferences.Boards, Constants.Fields.AccommodationBoardItem.BoardType);
        }

        /// <inheritdoc/>
        protected internal override object MapReference(Item referenceTypeItem, Item referenceItem)
        {
            return new HotelBoard
            {
                Name = referenceTypeItem.Fields[Constants.Fields.DatasourceItem.Name]?.Value,
                ItemName = referenceTypeItem.Name,
                Code = referenceTypeItem.Fields[Constants.Fields.DatasourceItem.Code]?.Value,
                Content = GetFieldValue(referenceTypeItem, referenceItem, Constants.Fields.AccommodationReferenceItem.Content),
                Description = GetFieldValue(referenceTypeItem, referenceItem, Constants.Fields.AccommodationReferenceItem.Description),
                IconUrl = GetIcon(referenceTypeItem, referenceItem),
                BoardGroup = GetBoardTypeGroup(referenceTypeItem)
            };
        }

        private DatasourceObject GetBoardTypeGroup(Item item)
        {
            LookupField typeField = item.Fields[Constants.Fields.BoardTypeItem.BoardGroup];
            var type = typeField?.TargetItem;

            return type != null ? new DatasourceObject(type, true) : null;
        }
    }
}