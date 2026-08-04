using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class HotelTransfer
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public IEnumerable<Airport> Airports { get; set; }

        public string IconUrl { get; set; }

        public string Content { get; set; }

        public IEnumerable<ContentByDate> ContentByDate { get; set; }
    }
}