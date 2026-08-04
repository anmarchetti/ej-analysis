using System.Text;
using System.Text.RegularExpressions;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class NormalaziedNameComputedField : BaseComputedIndexField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var item = indexableItem.Item;
            string name = item[Constants.Fields.DatasourceItem.Name];
            if (string.IsNullOrEmpty(name))
            {
                return null;
            }

            name = name.Normalize(NormalizationForm.FormKD);

            return Regex.Replace(name, @"\p{M}", string.Empty).ToLower();
        }

        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.IsDestinationItem()
                || indexableItem.Item.IsVirtualDestinationItem();
        }
    }
}