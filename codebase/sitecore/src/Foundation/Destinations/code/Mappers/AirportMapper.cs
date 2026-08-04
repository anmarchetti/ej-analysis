using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Mappers
{
    public static class AirportMapper
    {
        /// <summary>
        /// Build Airport Group mapper.
        /// </summary>
        /// <param name="parent">Root item for Airport groups.</param>
        /// <param name="departureAirportCodes">Collection of airport departure codes.</param>
        /// <returns>Collections of airport groups.</returns>
        public static IEnumerable<AirportBase> BuildAirportGroup(Item parent, HashSet<string> departureAirportCodes)
        {
            if (parent == null)
            {
                yield break;
            }

            foreach (Item item in parent.Children)
            {
                if (item.TemplateID == Constants.TemplateIds.Airport)
                {
                    var isDepartureAirport = departureAirportCodes.Contains(item?.Fields[Constants.Fields.DatasourceItem.Code]?.Value);

                    if (!isDepartureAirport)
                    {
                        continue;
                    }

                    yield return new Airport(item, true);
                }

                if (item.TemplateID == Constants.TemplateIds.AirportsGroup)
                {
                    var airportGroups = new AirportsGroup(item)
                    {
                        Airports = BuildAirportGroup(item, departureAirportCodes)
                    };
                    yield return airportGroups;
                }
            }
        }
    }
}