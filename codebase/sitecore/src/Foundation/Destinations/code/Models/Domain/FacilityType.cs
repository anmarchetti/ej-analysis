using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FacilityType : DatasourceObject
    {
        // Requires for deserialization
        public FacilityType()
        {
        }

        public FacilityType(Item item)
            : base(item)
        {
            Code = BuildFacilityCode(item);
            TrackingId = ItemUtils.GetTrackingId(item);
        }

        /// <summary>
        /// Gets or sets the tracking id
        /// </summary>
        public string TrackingId { get; set; }

        private string BuildFacilityCode(Item item)
        {
            if (item == null)
            {
                return string.Empty;
            }

            var groupCode = item.Parent?.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
            var facilityCode = item.Fields[Constants.Fields.DatasourceItem.Code]?.Value;

            if (!string.IsNullOrEmpty(groupCode) && !string.IsNullOrEmpty(facilityCode))
            {
                return $"{groupCode}-{facilityCode}";
            }

            return !string.IsNullOrEmpty(facilityCode) ? facilityCode : string.Empty;
        }
    }
}