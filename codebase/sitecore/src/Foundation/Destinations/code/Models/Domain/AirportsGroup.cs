using System.Collections.Generic;
using System.Linq;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class AirportsGroup : AirportBase
    {
        public AirportsGroup(Item item)
            : base(item)
        {
        }

        public IEnumerable<AirportBase> Airports { get; set; }

        public bool HasDepartureAirports
        {
            get
            {
                return Airports?.Any(x => x is Airport airport && airport.IsDepartureAirport.GetValueOrDefault(false)) ?? false;
            }
        }
    }
}