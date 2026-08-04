using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class DestinationItinerary
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public IEnumerable<Itinerary> Itineraries { get; set; }
    }
}