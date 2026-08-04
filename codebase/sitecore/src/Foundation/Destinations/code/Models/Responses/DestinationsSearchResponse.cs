using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class DestinationsSearchResponse
    {
        public DestinationsSearchResponse(IEnumerable<ChildDestination> destinations)
        {
            Destinations = destinations ?? new List<ChildDestination>();
        }

        public IEnumerable<ChildDestination> Destinations { get; set; }
    }
}