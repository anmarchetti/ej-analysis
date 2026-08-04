using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class BoardTypeReportRow
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="BoardTypeReportRow"/> class.
        /// Needs for deserialization.
        /// </summary>
        public BoardTypeReportRow()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BoardTypeReportRow"/> class.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public BoardTypeReportRow(Item item)
        {
            if (item == null)
            {
                return;
            }

            BoardCode = item.Fields[Constants.Fields.DatasourceItem.Code].Value;
            BoardItemName = item.DisplayName;
            BoardDisplayName = item.Fields[Constants.Fields.DatasourceItem.Name].Value;
            BoardGroup = item.GetTargetItem(Constants.Fields.BoardTypeItem.BoardGroup)?.Fields[Constants.Fields.DatasourceItem.Code].Value;
        }

        /// <summary>
        /// Gets or sets board code.
        /// </summary>
        public string BoardCode { get; set; }

        /// <summary>
        /// Gets or sets board item name.
        /// </summary>
        public string BoardItemName { get; set; }

        /// <summary>
        /// Gets or sets board display name.
        /// </summary>
        public string BoardDisplayName { get; set; }

        /// <summary>
        /// Gets or sets  board group code.
        /// </summary>
        public string BoardGroup { get; set; }
    }
}