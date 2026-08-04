using easyJet.Foundation.Destinations.Extensions;
using Sitecore.Data.Items;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.HotelBeds.Models.Domain
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

        public FacilityReportRow(Item facilityItem, string facilityVirualGroup, string source)
        {
            FacilityCode = facilityItem[DestinationsConstants.Fields.DatasourceItem.Code];
            FacilityName = !string.IsNullOrWhiteSpace(facilityItem[DestinationsConstants.Fields.DatasourceItem.Name]) ? facilityItem[DestinationsConstants.Fields.DatasourceItem.Name] : facilityItem.Name;
            ShowOnSite = (facilityItem[DestinationsConstants.Fields.BaseAppearance.ShowOnSite] == DestinationsConstants.Common.CheckboxTrueValue).ToString();
            FacilityGroup = facilityItem.Parent.Name;
            FacilityVirualGroup = facilityVirualGroup;
            Source = source;
            SortOrder = facilityItem.Fields[DestinationsConstants.Fields.StandardFields.SortOrder].Value;
        }

        public string FacilityCode { get; set; }

        public string FacilityName { get; set; }

        public string FacilityGroup { get; set; }

        public string FacilityVirualGroup { get; set; }

        public string ShowOnSite { get; set; }

        public string Source { get; set; }

        public string SortOrder { get; set; }
    }
}