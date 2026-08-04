using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler
{
    /// <summary>
    /// Service for modifing price for alt flights
    /// </summary>
    public class AlternativeFlightsCachePriceService : IAlternativeFlightsCachePriceService
    {
        private readonly IEnumerable<IFlightCachePriceHandler> _handlers;

        /// <summary>
        /// ctor
        /// </summary>
        /// <param name="handlers"></param>
        public AlternativeFlightsCachePriceService(IEnumerable<IFlightCachePriceHandler> handlers)
        {
            _handlers = handlers;
        }

        /// <inheritdoc />
        public async Task Handle(AlternativeFlightsCachePriceCalculationContext context)
        {
            foreach (var handler in _handlers)
            {
                await handler.Handle(context);
            }

            CalculateOfferTotalPrice(context.AlternativeFlightOffers);
        }

        private void CalculateOfferTotalPrice(List<AlternativeFlightOffer> offers)
        {
            offers?.ForEach(offer => offer.TotalPrice = offer.Price + offer.SeatsPrice + offer.TransferPrice + offer.ExtraLuggagePrice - offer.DiscountAmount);
        }
    }
}
