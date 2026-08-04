using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class Airport : AirportBase
    {
        // Requires for deserialization
        public Airport()
        {
        }

        public Airport(Item item, bool isDepartureAirport)
            : this(item)
        {
            IsDepartureAirport = isDepartureAirport;
        }

        public Airport(Item item)
            : base(item)
        {
            AirportGroup = item.Parent.Fields[Constants.Fields.DatasourceItem.Name]?.Value;
            Latitude = item.Fields[Constants.Fields.POIs.Latitude]?.Value;
            Longitude = item.Fields[Constants.Fields.POIs.Longitude]?.Value;
            TrackingId = ItemUtils.GetTrackingId(item);
        }

        public string AirportGroup { get; set; }

        public bool? IsDepartureAirport { get; set; }

        public string Latitude { get; set; }

        public string Longitude { get; set; }

        public string TrackingId { get; set; }
    }
}