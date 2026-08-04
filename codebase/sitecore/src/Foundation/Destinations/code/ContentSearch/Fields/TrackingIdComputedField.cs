using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    /// <summary>
    /// Indexes the tracking ide.
    /// </summary>
    public class TrackingIdComputedField : BaseComputedIndexField
    {
        private const string EnglishLanguageName = "en";

        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            return ItemUtils.GetTrackingId(indexableItem.Item, EnglishLanguageName);
        }

        /// <inheritdoc/>
        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.IsDestinationItem()
                || indexableItem.Item.IsVirtualDestinationItem()
                || indexableItem.Item.TemplateID == Constants.TemplateIds.AirportsGroup
                || indexableItem.Item.TemplateID == Constants.TemplateIds.Airport;
        }
    }
}
