using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Utilities;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    /// <summary>
    /// Represents Itineraries Computed Field
    /// Collects array of Itineraries in JSON format.
    /// </summary>
    public class ItinerariesComputedField : BaseComputedIndexField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var itinerariesFolder = indexableItem.Item.Children.FirstOrDefault(x => x.TemplateID == Constants.TemplateIds.ItinerariesFolder);

            var itineraries = itinerariesFolder?.Children
                .Where(x => x.TemplateID == Constants.TemplateIds.Itinerary)
                .Select(x => new Itinerary(x));

            return itineraries != null ? JsonConvert.SerializeObject(itineraries) : null;
        }

        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.Location) ||
                   indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.LocationCity) ||
                   indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.Resort);
        }
    }
}