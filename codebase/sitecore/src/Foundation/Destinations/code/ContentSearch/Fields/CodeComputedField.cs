using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    /// <summary>
    /// TODO: temperary computed field that store Atcom code for datasource object and giata code for hotel code.
    /// </summary>
    public class CodeComputedField : BaseComputedIndexField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var item = indexableItem.Item;
            if (item.TemplateID == Constants.TemplateIds.Accommodation)
            {
                return item[Constants.Fields.AccommodationItem.GiataCode];
            }

            return item[Constants.Fields.DatasourceItem.Code];
        }

        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.IsDestinationItem()
                || indexableItem.Item.IsVirtualDestinationItem()
                || indexableItem.Item.TemplateID == Constants.TemplateIds.AirportsGroup
                || indexableItem.Item.TemplateID == Constants.TemplateIds.Airport
                || indexableItem.Item.TemplateID == Constants.TemplateIds.RoomType
                || indexableItem.Item.TemplateID == Constants.TemplateIds.BoardType
                || indexableItem.Item.TemplateID == Constants.TemplateIds.FacilityType
                || indexableItem.Item.TemplateID == Constants.TemplateIds.AccommodationRoomsFolder;
        }
    }
}