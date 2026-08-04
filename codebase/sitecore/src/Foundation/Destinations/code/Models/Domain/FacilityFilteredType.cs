using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FacilityFilteredType : FacilityType
    {
        // Requires for deserialization
        public FacilityFilteredType()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="FacilityFilteredType"/> class.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public FacilityFilteredType(Item item)
            : base(item)
        {
            FacilityFilterGroup = GetFacilityFilterGroup(item);
            Tooltip = item.Fields[Constants.Fields.FacilityTypeItem.TooltipText]?.Value;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="FacilityFilteredType"/> class.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="order">Order of item.</param>
        public FacilityFilteredType(Item item, int order)
            : this(item)
        {
            Order = order;
        }

        /// <summary>
        /// Gets or sets facilityFilterGroup object with facility type's group data.
        /// </summary>
        public FacilityFilterGroup FacilityFilterGroup { get; set; }

        /// <summary>
        /// Gets or sets order.
        /// </summary>
        public int Order { get; set; }

        /// <summary>
        /// Gets or sets tooltip.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Get facilityFilterGroup data from facility type.
        /// </summary>
        /// <param name="item">Facility type item.</param>
        /// <returns>FacilityFilterGroup object with facility type's group data.</returns>
        private FacilityFilterGroup GetFacilityFilterGroup(Item item)
        {
            if (!item.TemplateID.Equals(Constants.TemplateIds.FacilityType))
            {
                return null;
            }

            var facilityGroupItem = ((LookupField)item.Fields[Constants.Fields.FacilityTypeItem.FacilityFilterGroup])?.TargetItem;

            // WP-599 Only Hotels which are directly tagged with certified sustainable should appear in the filter
            if (facilityGroupItem == null || facilityGroupItem.ID.Equals(Constants.ItemIds.CertifiedSustainable))
            {
                return null;
            }

            return new FacilityFilterGroup(facilityGroupItem);
        }
    }
}