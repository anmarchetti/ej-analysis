using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class ErrataFacilitiesComputedField : AccommodationReferenceComputedField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            return ComputeReference(indexableItem.Item, Constants.AccommodationReferences.Facilities, Constants.Fields.BaseFacilityItem.FacilityType);
        }

        /// <inheritdoc/>
        protected internal override object MapReference(Item referenceTypeItem, Item referenceItem)
        {
            return new HotelFacility(referenceTypeItem, referenceItem);
        }

        /// <inheritdoc/>
        protected override bool IsValid(Item referenceTypeItem, Item referenceItem)
        {
            return base.IsValid(referenceTypeItem, referenceItem) &&
                (referenceTypeItem[Constants.Fields.FacilityTypeItem.SetAsFacilityErrata] == Constants.Common.CheckboxTrueValue) &&
                (referenceTypeItem[Constants.Fields.BaseAppearance.ShowOnSite] == Constants.Common.CheckboxTrueValue) &&
                (referenceItem[Constants.Fields.BaseAppearance.ShowOnSite] == Constants.Common.CheckboxTrueValue);
        }
    }
}