using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class Itinerary : BaseItinenary
    {
        // Requires for deserialization
        public Itinerary()
        {
        }

        public Itinerary(Item item)
            : base(item)
        {
            if (item == null)
            {
                return;
            }

            ImageUrl = item.GetMediaUrl(Constants.Fields.SitecoreImageItem.Image);
            RouteType = item.Fields[Constants.Fields.Itinerary.RouteType]?.Value;
            TotalDistance = MainUtil.GetFloat(item.Fields[Constants.Fields.Itinerary.TotalDistance]?.Value, 0);
            POIs = item.Children.Where(x => x.TemplateID == Constants.TemplateIds.POI).Select(x => new POIs(x));
        }

        public string ImageUrl { get; set; }

        public string RouteType { get; set; }

        public float TotalDistance { get; set; }

        public IEnumerable<POIs> POIs { get; set; }
    }
}