using easyJet.Foundation.Destinations.Models.Domain;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class BoardGroupComputedField : BaseComputedIndexField
    {
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var item = ((LookupField)indexableItem.Item.Fields[Constants.Fields.BoardTypeItem.BoardGroup])?.TargetItem;

            if (item == null)
            {
                return null;
            }

            return JsonConvert.SerializeObject(new DatasourceObject(item, true));
        }

        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.BoardType);
        }
    }
}