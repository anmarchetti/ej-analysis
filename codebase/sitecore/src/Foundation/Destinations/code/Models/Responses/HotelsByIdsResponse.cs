using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class HotelsByIdsResponse
    {
        public HotelsByIdsResponse(IList<Hotel> hotels)
        {
            Hotels = hotels ?? new List<Hotel>();
        }

        public IList<Hotel> Hotels { get; set; }
    }
}