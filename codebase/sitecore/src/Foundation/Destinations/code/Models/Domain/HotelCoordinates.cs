using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class HotelCoordinates
    {
        public HotelCoordinates(HotelSearchResultItem hotelItem)
        {
            if (hotelItem == null)
            {
                return;
            }

            Code = hotelItem.Code;
            Name = hotelItem.Name;
            Latitude = hotelItem.Latitude;
            Longitude = hotelItem.Longitude;
        }

        public string Code { get; set; }

        public string Name { get; set; }

        public float Latitude { get; set; }

        public float Longitude { get; set; }
    }
}