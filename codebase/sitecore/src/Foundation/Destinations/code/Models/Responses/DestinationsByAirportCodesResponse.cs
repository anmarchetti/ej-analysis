using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class DestinationsByAirportCodesResponse
    {
        public DestinationsByAirportCodesResponse()
        {
            Destinations = new List<ChildDestination>();
        }

        public List<ChildDestination> Destinations { get; set; }

        public int Page { get; set; }

        public int Take { get; set; }

        public int Total { get; set; }
    }
}