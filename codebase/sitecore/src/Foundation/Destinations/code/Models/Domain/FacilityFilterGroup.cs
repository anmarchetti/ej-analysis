using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FacilityFilterGroup
    {
        public FacilityFilterGroup()
        {
        }

        public FacilityFilterGroup(Item item)
        {
            if (item == null || item.TemplateID != Constants.TemplateIds.FacilityType)
            {
                return;
            }

            Sitecore.Data.Fields.CheckboxField showInFilter =
                item.Fields[Constants.Fields.FacilityTypeItem.ShowInFilter];

            if (showInFilter == null || !showInFilter.Checked)
            {
                return;
            }

            var facilityType = new FacilityType(item);
            Name = facilityType.Name;
            Code = facilityType.Code;
            TrackingId = facilityType.TrackingId;
            ParentName = item.Parent?.Fields[Constants.Fields.DatasourceItem.Name]?.Value;
            ParentCode = item.Parent?.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
            Tooltip = item.Fields[Constants.Fields.FacilityTypeItem.TooltipText]?.Value;
        }

        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the tracking id
        /// </summary>
        public string TrackingId { get; set; }

        public string Code { get; set; }

        public string ParentName { get; set; }

        public string ParentCode { get; set; }

        public string Tooltip { get; set; }
    }
}