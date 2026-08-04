using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FacilityReportRow
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="FacilityReportRow"/> class.
        /// This ctor needs for deserialization.
        /// </summary>
        public FacilityReportRow()
        {
        }

        public FacilityReportRow(Item facilityItem, string facilityVirualGroup)
        {
            FacilityCode = facilityItem[Constants.Fields.DatasourceItem.Code];
            FacilityName = facilityItem[Constants.Fields.DatasourceItem.Name];
            ShowOnSite = (facilityItem[Constants.Fields.BaseAppearance.ShowOnSite] == Constants.Common.CheckboxTrueValue).ToString();
            FacilityGroup = facilityItem.Parent.Name;
            FacilityVirualGroup = facilityVirualGroup;
        }

        public string FacilityCode { get; set; }

        public string FacilityName { get; set; }

        public string FacilityGroup { get; set; }

        public string FacilityVirualGroup { get; set; }

        public string ShowOnSite { get; set; }
    }
}