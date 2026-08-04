using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Logging;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using System.Collections.ObjectModel;
using System.Globalization;
using Airport = easyJet.Holidays.Api.Domain.Data.ReferenceData.Airport;

namespace easyJet.Holidays.Api.Domain.Mappers
{
    /// <inheritdoc/>
    public class AirportsMapper(IReferenceDataService referenceDataService) : IAirportsMapper
    {
        private readonly IReferenceDataService _referenceDataService = referenceDataService;

        /// <inheritdoc/>
        public async Task EnrichAirportDetails(IReadOnlyCollection<Offer> offers)
        {
            var allRoutes = offers.SelectMany(o => o.Transport.Routes).ToList();

            foreach (var offer in offers)
            {
                foreach (var route in offer.Transport.Routes)
                {
                    if (offer.Location != null)
                    {
                        if (route.Direction == Direction.Outbound)
                        {
                            route.ArrLocation = offer.Location.City;
                        }

                        if (route.Direction == Direction.Inbound)
                        {
                            route.DepLocation = offer.Location.City;
                        }
                    }
                }
            }

            await EnrichAirportsDetails(allRoutes);
        }

        /// <inheritdoc/>
        public async Task EnrichAirportDetails(AmendTransport amendTransport)
        {
            var allRoutes = amendTransport.Routes.ToList();

            await EnrichAirportsDetails(allRoutes);
        }

        /// <inheritdoc/>
        public async Task EnrichAirportsDetails(IReadOnlyCollection<Route> routes)
        {
            var airports = await _referenceDataService.GetAirports();

            if (airports == null || routes == null)
            {
                return;
            }

            var logger = LoggerFactoryProvider.CreateLogger<AirportsMapper>();
            var missingCodes = new HashSet<string>();

            foreach (var route in routes)
                EnrichRouteAirportsDetails(route, airports, missingCodes);

            #pragma warning disable S2583 // false positive
            if (missingCodes.Count > 0)
            { 
                logger.LogError("Can not find airport names for codes: {Codes}", string.Join(", ", missingCodes));
            }
        }

        /// <summary>
        /// Adds airport details to route
        /// </summary>
        /// <param name="route"></param>
        /// <param name="airports"></param>
        /// <param name="missingCodes">Collection of codes that weren't found in airports</param>
        private static void EnrichRouteAirportsDetails(Route route, Dictionary<string, Airport> airports, HashSet<string> missingCodes)
        {
            EnrichRouteAirportDetails(
                route.DepPt,
                airports,
                missingCodes,
                x => route.DepName = x,
                x => route.DepItemName = x,
                x => { if (string.IsNullOrWhiteSpace(route.DepLocation)) route.DepLocation = x; });

            EnrichRouteAirportDetails(
                route.ArrPt,
                airports,
                missingCodes,
                x => route.ArrName = x,
                x => route.ArrItemName = x,
                x => { if (string.IsNullOrWhiteSpace(route.ArrLocation)) route.ArrLocation = x; });
        }

        /// <summary>
        /// Adds airport details to a single airport in a route
        /// </summary>
        /// <param name="airportCode"></param>
        /// <param name="airports"></param>
        /// <param name="missingCodes"></param>
        /// <param name="setName"></param>
        /// <param name="setItemName"></param>
        /// <param name="setLocation">Collection of codes that weren't found in airports</param>
        private static void EnrichRouteAirportDetails(
            string airportCode, 
            Dictionary<string, Airport> airports, 
            HashSet<string> missingCodes, 
            Action<string> setName, 
            Action<string> setItemName, 
            Action<string> setLocation)
        {
            if (string.IsNullOrWhiteSpace(airportCode)) 
                return;

            if (airports.TryGetValue(airportCode, out var airport))
            {
                setName(airport.Name);
                setItemName(airport.ItemName);
                setLocation(airport.AirportGroup);
            }
            else
            {
                setName(airportCode);
                setItemName(airportCode);

                missingCodes.Add(airportCode);
            }
        }

        /// <summary>
        /// Adds distance to original airport in km if it was provided in request
        /// </summary>
        /// <returns></returns>
        public async Task EnrichAirportDistance(SearchOffersResponse offersResponse, AlternativeFlightsSearchRequest request)
        {
            var airportsData = await _referenceDataService.GetAirports();

            if (request.OriginalAirport is null)
                return;

            airportsData.TryGetValue(request.OriginalAirport, out var originalAirport);

            if (originalAirport is null || originalAirport.Latitude is null || originalAirport.Longitude is null)
                return;

            foreach (var offer in offersResponse.Offers)
            {
                var departureAirportCode = offer.Transport.OutboundFlight.DepPt;

                airportsData.TryGetValue(departureAirportCode, out var departureAirport);

                if (departureAirport is null || departureAirport.Latitude is null || departureAirport.Longitude is null)
                    continue;

                var distance = MathUtils.GetDistance(originalAirport.Latitude.Value, originalAirport.Longitude.Value,
                    departureAirport.Latitude.Value, departureAirport.Longitude.Value);
                offer.DistanceToOriginalAirport = Convert.ToInt32(Math.Round(distance));
            }
        }
    }
}
