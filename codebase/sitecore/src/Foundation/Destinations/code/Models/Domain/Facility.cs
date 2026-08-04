using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class Facility : DatasourceObject
    {
        // Requires for deserialization
        public Facility()
        {
        }

        public Facility(Item item)
            : base(item)
        {
            GroupCode = item?.Parent.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
            ToolTip = item?.Parent.Fields[Constants.Fields.FacilityTypeItem.TooltipText]?.Value;
            Icon = item?.GetMediaUrl(Constants.Fields.SitecoreIconItem.Icon);
        }

        public string GroupCode { get; set; }

        public string Icon { get; set; }

        public string ToolTip { get; set; }
    }
}