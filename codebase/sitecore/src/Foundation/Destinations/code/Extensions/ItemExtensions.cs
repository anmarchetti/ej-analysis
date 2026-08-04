using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Extensions
{
    public static class ItemExtensions
    {
        /// <summary>
        /// Get code from reference type field.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="referanceTypeFieldName">Reference type field name.</param>
        /// <returns>Datasource code.</returns>
        public static string GetDatasourceCode(this Item item, string referanceTypeFieldName)
        {
            return item.GetItems(referanceTypeFieldName).FirstOrDefault()?.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
        }

        /// <summary>
        /// Get item sort order.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="defaultSortOrder">Default sitecore sort order.</param>
        /// <returns>Item sort order.</returns>
        public static int GetSortOrder(this Item item, int defaultSortOrder = 0)
        {
            return int.TryParse(item.Fields[Constants.Fields.StandardFields.SortOrder]?.Value, out int sortOrder) ? sortOrder : defaultSortOrder;
        }

        /// <summary>
        /// Get accommodation items such as Boards, Images, Facilities, Rooms.
        /// </summary>
        /// <param name="accommodationItem">Accommodation item.</param>
        /// <param name="referenceTemplateId">TemplateId key value pair where 'key' - Folder Id and value Type Id.</param>
        /// <returns>Collection of accommodation entities (boards, images, facilitites, rooms.</returns>
        public static IEnumerable<Item> GetAccommodationReferences(this Item accommodationItem, KeyValuePair<ID, ID> referenceTemplateId)
        {
            var facilitiesFolder = accommodationItem?.Children?.FirstOrDefault(x => x.TemplateID == referenceTemplateId.Key);
            return facilitiesFolder?.Children?.Where(x => x.TemplateID == referenceTemplateId.Value) ?? Enumerable.Empty<Item>();
        }

        /// <summary>
        /// Get first paragraph of description from Destination Item.
        /// </summary>
        /// <param name="destinationItem">Destination Item.</param>
        /// <returns>First paragraph of description.</returns>
        public static string GetFirstParagraphDescription(this Item destinationItem)
        {
            if (destinationItem == null || !destinationItem.IsDestinationItem())
            {
                return null;
            }

            HtmlField descriptionField = destinationItem.Axes.SelectSingleItem(destinationItem.QuerySafePath() +
                                      $"/*[@@templateid='{Constants.TemplateIds.PageComponentsFolder}']/*[@@templateid='{Constants.TemplateIds.DestinationInfoBlocksFolder}']/*[@@templateid='{Constants.TemplateIds.DestinationInfoBlock}']")?.Fields[Constants.Fields.DestinationInfoBlock.Description];

            return descriptionField?.GetPlainText()?.Split('\n').FirstOrDefault();
        }
    }
}