using System.Linq;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class SourceComputedField : AccommodationComputedField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var items = indexableItem.Item?.Children?.Where(x => x.TemplateID == Constants.TemplateIds.AccommodationRoomsFolder);

            return items?.Where(item => !string.IsNullOrEmpty(item[Constants.Fields.DatasourceItem.Code])).Select(item => item[Constants.Fields.DatasourceItem.Code]).ToArray();
        }
    }
}