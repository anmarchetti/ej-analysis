using System.Linq;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class HotelHighlightsComputedField : AccommodationComputedField
    {
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            MultilistField hotelHighlightsField = indexableItem?.Item?.Fields[Constants.Fields.AccommodationItem.HotelHighlights];
            if (hotelHighlightsField == null || hotelHighlightsField.TargetIDs.Length == 0)
            {
                return null;
            }

            var tiles = hotelHighlightsField.GetItems().Select(x => new HotelHighlights
            {
                Title = x.Fields[Constants.Fields.CarouselTile.Title]?.Value,
                Subtitle = x.Fields[Constants.Fields.CarouselTile.Subtitle]?.Value,
                Description = x.Fields[Constants.Fields.CarouselTile.Description]?.Value,
                Image = x.GetMediumMediaUrl(Constants.Fields.CarouselTile.Image)
            });

            return JsonConvert.SerializeObject(tiles);
        }
    }
}