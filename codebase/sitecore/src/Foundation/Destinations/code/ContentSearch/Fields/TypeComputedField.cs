using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class TypeComputedField : AccommodationComputedField
    {
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            MultilistField typesField = indexableItem?.Item?.Fields[Constants.Fields.AccommodationItem.Types];
            return typesField?.Count > 0 ? typesField.GetItems().Select(type => JsonConvert.SerializeObject(new Type(type))).ToArray() : null;
        }
    }
}