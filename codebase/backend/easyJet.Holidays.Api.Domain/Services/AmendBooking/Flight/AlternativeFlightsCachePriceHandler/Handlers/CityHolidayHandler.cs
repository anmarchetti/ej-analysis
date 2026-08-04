using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers
{
    /// <summary>
    /// We load packages for city without transfer information.
    /// We should increase our package price with transfer price, if current booking have a transfer.
    /// Package price use then to select Promo code tier. 
    /// </summary>
    public class CityHolidayHandler : IFlightCachePriceHandler
    {
        private const string DefaultTransferCode = "DEFAULTH";
        private readonly IItemSearchService _itemSearchService;

        /// <summary>
        /// ctor
        /// </summary>
        /// <param name="itemSearchService"></param>
        public CityHolidayHandler(IItemSearchService itemSearchService)
        {
            _itemSearchService = itemSearchService;
        }

        /// <inheritdoc />
        public async Task Handle(AlternativeFlightsCachePriceCalculationContext context)
        {
            if (context.PackageTheme == PackageThemeType.City && !string.Equals(context.AmendFlightSearchRequest.Transfer, DefaultTransferCode, StringComparison.InvariantCultureIgnoreCase))
                await UpdateAlternativeFlightPriceForCityHoliday(context.AlternativeFlightOffers, context.RequestOffer);
        }

        /// <summary>
        /// Enrich offer with transfer information. 
        /// </summary>
        /// <param name="alternativeFlightsWithoutDetails">Offer list which should be enriched.</param>
        /// <param name="offer">Offer</param>
        /// <returns>List offer enriched with transfer information.</returns>
        private async Task UpdateAlternativeFlightPriceForCityHoliday(
            List<AlternativeFlightOffer> alternativeFlightsWithoutDetails,
            Offer offer)
        {
            var transferInformation =
                (await _itemSearchService.GetExtras(offer))?.Transfers.SingleOrDefault(x => x.Code == offer?.Transfers?.FirstOrDefault()?.Code);

            foreach (var alternativeFlightOffer in alternativeFlightsWithoutDetails)
            {
                if (transferInformation != null)
                {
                    alternativeFlightOffer.Transfers = new List<TransferItem> { transferInformation };
                    alternativeFlightOffer.TransferPrice = transferInformation.Price;
                }
            }
        }
    }
}
