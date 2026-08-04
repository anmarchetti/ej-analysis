using System.Linq;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class RelatedResortsComputedField : BaseComputedIndexField
    {
        /// <summary>
        /// Return codes from indexable item's related resorts.
        /// </summary>
        /// <param name="indexableItem">Indexable item.</param>
        /// <returns>Codes of related resorts.</returns>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            MultilistField multilist = indexableItem.Item.Fields[Constants.Fields.VirtualDestination.Resorts];

            return multilist?.GetItems()?.Select(x => x.Fields[Constants.Fields.DatasourceItem.Code]?.Value).ToArray();
        }

        /// <inheritdoc/>
        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
            => indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.VirtualResort);
    }
}