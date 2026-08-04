using System.Linq;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class RelatedRegionsComputedField : BaseComputedIndexField
    {
        /// <summary>
        /// Return codes from indexable item's related regions.
        /// </summary>
        /// <param name="indexableItem">Indexable item.</param>
        /// <returns>Codes of related regions.</returns>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            MultilistField multilist = indexableItem.Item.Fields[Constants.Fields.VirtualDestination.Regions];

            return multilist?.GetItems()?.Select(x => x.Fields[Constants.Fields.DatasourceItem.Code]?.Value).ToArray();
        }

        /// <inheritdoc/>
        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.VirtualRegion) || indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.VirtualCountry);
        }
    }
}