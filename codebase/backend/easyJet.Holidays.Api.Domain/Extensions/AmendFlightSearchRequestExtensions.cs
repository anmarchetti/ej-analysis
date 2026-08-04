using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;

namespace easyJet.Holidays.Api.Domain.Extensions
{
    /// <summary>
    ///  Extension methods for AmendFlightSearchRequestExtensions used in flights amendments
    /// </summary>
    public static class AmendFlightSearchRequestExtensions
    {
        /// <summary>
        /// Get offer the same as in booking response, usually from s_tp=4 cache response
        /// </summary>
        /// <param name="amendFlightsSearchRequest"></param>
        /// <param name="alternativeFlightsWithoutDetails"></param>
        /// <returns></returns>
        public static Offer GetCurrentFlight(this AmendFlightSearchRequest amendFlightsSearchRequest, SearchOffersResponse alternativeFlightsWithoutDetails)
        {
            if (alternativeFlightsWithoutDetails.Offers.IsNullOrEmpty())
                return null;

            if (string.IsNullOrEmpty(amendFlightsSearchRequest.OutboundFlightNo) || string.IsNullOrEmpty(amendFlightsSearchRequest.InboundFlightNo))
                return null;

            return alternativeFlightsWithoutDetails?.Offers?.FirstOrDefault(offer =>
            {
                return CompareFlights(amendFlightsSearchRequest, offer?.Transport?.Routes[0]?.FlightNumberWithoutCar, offer?.Transport?.Routes[1]?.FlightNumberWithoutCar);
            });
        }

        private static bool CompareFlights(AmendFlightSearchRequest amendFlightsSearchRequest, string outBoundFltWithoutCar, string inBoundFltWithoutCar)
        {
            return string.Equals(amendFlightsSearchRequest.OutboundFlightNo, outBoundFltWithoutCar, StringComparison.OrdinalIgnoreCase) &&
                   string.Equals(amendFlightsSearchRequest.InboundFlightNo, inBoundFltWithoutCar, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Deletes the current flight.
        /// </summary>
        /// <param name="amendFlightsSearchRequest">The amend flights search request.</param>
        /// <param name="alternativeFlightsWithoutDetails">The alternative flights without details.</param>
        public static void DeleteCurrentFlight(this SearchOffersResponse alternativeFlightsWithoutDetails, AmendFlightSearchRequest amendFlightsSearchRequest)
        {
            if (!string.IsNullOrEmpty(amendFlightsSearchRequest.OutboundFlightNo) &&
                !string.IsNullOrEmpty(amendFlightsSearchRequest.InboundFlightNo))
            {
                alternativeFlightsWithoutDetails.Offers = DeleteCurrentFlight(alternativeFlightsWithoutDetails.Offers,
                        amendFlightsSearchRequest.OutboundFlightNo,
                        amendFlightsSearchRequest.InboundFlightNo)
                    .ToList();
            }
        }

        /// <summary>
        /// Deletes the current flight.
        /// </summary>
        /// <param name="offers">The offers.</param>
        /// <param name="currentOutboundFlightNumber">The current outbound flight number.</param>
        /// <param name="currentInboundFlightNumber">The current inbound flight number.</param>
        /// <returns></returns>
        private static IEnumerable<Offer> DeleteCurrentFlight(List<Offer> offers, string currentOutboundFlightNumber, string currentInboundFlightNumber)
        {
            //currentOutboundFlightNo or currentInboundFlightNo are received without "Car"(e.g. currentOutboundFlightNo = "2032")
            //but in the offer there are routes where flightNo looks like "EZY2032" and "Car" = "EZY"
            //Therefore before comparing we should delete "Car" from "FlightNo" in the offer
            return offers?.Where(offer =>
            {
                var outBoundFltWithoutCar =
                    RemoveFlightNoPrefix(offer?.Transport?.Routes[0]?.FltNo, offer?.Transport?.Routes[0]?.Car);

                var inBoundFltWithoutCar =
                    RemoveFlightNoPrefix(offer?.Transport?.Routes[1]?.FltNo, offer?.Transport?.Routes[1]?.Car);

                return !string.Equals(currentOutboundFlightNumber, outBoundFltWithoutCar, StringComparison.OrdinalIgnoreCase) ||
                       !string.Equals(currentInboundFlightNumber, inBoundFltWithoutCar, StringComparison.OrdinalIgnoreCase);
            });
        }

        /// <summary>
        /// Remove prefix from FlightNo.
        ///currentOutboundFlightNo or currentInboundFlightNo are received without "Car"(e.g. currentOutboundFlightNo = "2032")
        /// but in the offer there are routes where flightNo looks like "EZY2032" and "Car" = "EZY"
        /// Therefore before comparing we should delete "Car" from "FlightNo" in the offer
        /// </summary>
        /// <param name="fltNo">FlightNo</param>
        /// <param name="flightPrefix">Prefix</param>
        /// <returns>FlightNo without prefix.</returns>
        private static string RemoveFlightNoPrefix(string fltNo, string flightPrefix)
        {
            var flightNoWithoutPrefix = string.IsNullOrEmpty(flightPrefix)
                ? fltNo
                : fltNo?.Replace(flightPrefix, string.Empty);

            return flightNoWithoutPrefix;
        }
    }
}
