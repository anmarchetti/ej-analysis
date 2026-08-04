using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers
{
    /// <summary>
    /// If inbound or outbound flight does not change
    /// we should calculate price for seats for this flight
    /// because package does not contains information about seats.
    /// </summary>
    public class SeatsPriceHandler : IFlightCachePriceHandler
    {

        /// <inheritdoc />
        public Task Handle(AlternativeFlightsCachePriceCalculationContext context)
        {
            if (context.RequestOffer?.SeatSelection?.Any() == true)
                UpdateAlternativeFlightWithSeatsInformation(context.AlternativeFlightOffers, context.RequestOffer.SeatSelection);
            return Task.CompletedTask;
        }

        /// <summary>
        /// adds seats price to offer
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="offerSeatSelection"></param>
        private void UpdateAlternativeFlightWithSeatsInformation(IEnumerable<AlternativeFlightOffer> offers, List<SeatMap> offerSeatSelection)
        {
            foreach (var offer in offers)
            {
                foreach (var transportRoute in offer.Transport.Routes)
                {
                    var seats = offerSeatSelection?.Where(seatMap => SeatsEquals(seatMap, transportRoute)).ToList()
                        ?? new List<SeatMap>();

                    offer.SeatSelection?.AddRange(seats);

                    offer.SeatSelection ??= new List<SeatMap>(seats);
                }

                offer.SeatsPrice = offer.SeatSelection?.Sum(seatMap => seatMap.Seats?.Sum(seat => seat.Price)) ?? default;
            }
        }

        private bool SeatsEquals(SeatMap seatMap, Route transportRoute)
        {
            return seatMap.FlightNumber.Equals(transportRoute.FlightNumberWithoutCar, StringComparison.InvariantCultureIgnoreCase);
        }
    }
}
