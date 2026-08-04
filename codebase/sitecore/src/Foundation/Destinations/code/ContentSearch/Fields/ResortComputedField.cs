using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class ResortComputedField : AccommodationHierarchyComputedField
    {
        public override Item GetHierarchyItem(Item accommodation)
        {
            // Assumming accommodations have three-level hierarchy
            return accommodation.Parent;
        }

        public override bool HierarchyItemIsValid(Item item)
        {
            return item.TemplateID.Equals(Constants.TemplateIds.Resort);
        }
    }
}