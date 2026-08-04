using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    public interface IAmendBookingFlightsService
    {
        /// <summary>
        /// Get alternative flights from Atcom cache
        /// </summary>
        /// <param name="bookingReference"></param>
        Task<AmendFlightOfferResponse> GetAlternativeFlights(string bookingReference);

        /// <summary>
        /// Get Full prive from atcom live with pormocode included 
        /// </summary>
        /// <param name="amendBookingFlightsPriceRequest"></param>
        /// <returns>Amedmnet charges for transport and price breakdown from promocode</returns>
        Task<AlternativeFlightFullPriceResponse> GetAlternativeFlightFullPrice(
            AlternativeFlightFullPriceRequest amendBookingFlightsPriceRequest);

        /// <summary>
        /// Get alternative flight from Atcom cache
        /// </summary>
        /// <param name="request">Amend date selected offer</param>
        /// <param name="booking">Atcom booking response</param>
        /// <returns>Alternative flight for selected offer.</returns>
        Task<IEnumerable<AmendDatesOffer>> GetAlternativeFlights(AmendDatesOffer request);
    }
}