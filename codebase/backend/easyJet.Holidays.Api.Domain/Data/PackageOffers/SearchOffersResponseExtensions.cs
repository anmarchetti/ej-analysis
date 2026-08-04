using easyJet.Holidays.Api.Domain.Data.AmendBooking;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers
{
    /// <summary>
    /// Offer models extensions
    /// </summary>
    public static class SearchOffersResponseExtensions
    {
        /// <summary>
        /// Get first Offer unit
        /// </summary>
        /// <param name="offer">Offer</param>
        /// <returns>First unit</returns>
        public static Unit FirstUnit(this Offer offer)
        {
            return offer?.Accom?.Unit?.FirstOrDefault();
        }

        /// <summary>
        /// Mapping Offer to AlternativeFlightOffer
        /// </summary>
        /// <param name="offer">Offer from Atcom cache.</param>
        /// <returns>Alternative flight offer (Shallow copy)</returns>
        public static AlternativeFlightOffer MapToAlternativeFlightOffer(this Offer offer)
        {
            var result = new AlternativeFlightOffer
            {
                Id = offer.Id,
                Date = offer.Date,
                Stay = offer.Stay,
                Price = offer.Price,
                PricePP = offer.PricePP,
                AmendmentsCharges = offer.AmendmentsCharges,
                Deposit = offer.Deposit,
                Accom = offer.Accom,
                AltBoards = offer.AltBoards,
                Location = offer.Location,
                Transport = offer.Transport,
                Transfers = offer.Transfers,
                LateRoomCheckout = offer.LateRoomCheckout,
                DefaultTransferCode = offer.DefaultTransferCode,
                Hotel = offer.Hotel,
                DeepLink = offer.DeepLink,
                hasDistressedFlights = offer.hasDistressedFlights,
                Promotion = offer.Promotion,
                IsSponsored = offer.IsSponsored,
                OtherRoutes = offer.OtherRoutes,
                LivePrice = offer.LivePrice,
                ErrataInfo = offer.ErrataInfo,
                SeatSelection = offer.SeatSelection,
                ModifiedPrice = offer.ModifiedPrice,
                Shortlist = offer.Shortlist,
                DistanceToOriginalAirport = offer.DistanceToOriginalAirport,
            };

            return result;
        }
    }
}
