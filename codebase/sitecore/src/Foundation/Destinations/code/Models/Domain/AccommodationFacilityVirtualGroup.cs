using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class AccommodationFacilityVirtualGroup : DatasourceObject
    {
        public AccommodationFacilityVirtualGroup()
        {
            Items = new List<HotelFacility>();
        }

        public string IconUrl { get; set; }

        public string Id { get; set; }

        public string Description { get; set; }

        public ImageData Image { get; set; }

        public string Title { get; set; }

        public IEnumerable<HotelFacility> Items { get; set; }
    }
}