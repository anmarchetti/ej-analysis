using easyJet.Foundation.Destinations.Utilities;
using Newtonsoft.Json;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    /// <summary>
    /// Represents Images Computed Field
    /// Collects array of Accommodation Images (small, medium and large sizes) in JSON format.
    /// </summary>
    public class ImagesComputedField : AccommodationComputedField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var images = new ImageUtils().GetChildImages(indexableItem.Item);

            return images != null ? JsonConvert.SerializeObject(images) : null;
        }
    }
}