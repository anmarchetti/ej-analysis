using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class DestinationSortOrderComputedField : BaseComputedIndexField
    {
        public const int MaxSortOrder = 4;

        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            switch (indexableItem.Item.TemplateName)
            {
                case Constants.TemplateNames.Country:
                    return 1;
                case Constants.TemplateNames.VirtualRegion:
                    return 2;
                case Constants.TemplateNames.Region:
                    return 2;
                case Constants.TemplateNames.RegionCity:
                    return 2;
                case Constants.TemplateNames.VirtualResort:
                case Constants.TemplateNames.Resort:
                    return 3;
                default:
                    return MaxSortOrder;
            }
        }

        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.IsDestinationItem()
                || indexableItem.Item.IsVirtualDestinationItem(VirtualDestinationTypes.Region | VirtualDestinationTypes.Resort);
        }
    }
}