using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler
{
    /// <summary>
    /// Service context for execution
    /// </summary>
    public class AlternativeFlightsCachePriceCalculationContext
    {
        /// <summary>
        /// Offers to modify
        /// </summary>
        public List<AlternativeFlightOffer> AlternativeFlightOffers { get; set; }

        /// <summary>
        /// Alternative flight request
        /// </summary>
        public AmendFlightSearchRequest AmendFlightSearchRequest { get; set; }

        /// <summary>
        /// Package theme
        /// </summary>
        public PackageThemeType PackageTheme { get; set; }

        /// <summary>
        /// Current offer
        /// </summary>
        public Offer RequestOffer { get; set; }
    }
}
