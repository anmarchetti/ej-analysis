using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using AirportParkingItem = easyJet.Holidays.Api.Domain.Data.AirportParking.AirportParkingItem;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Item search service
    /// </summary>
    public interface IItemSearchService
    {
        /// <summary>
        /// Get  available extras for offer
        /// </summary>
        /// <param name="offer">Offer model</param>
        /// <returns>Collection of all available extras</returns>
        Task<OfferExtras> GetExtras(Offer offer);

        /// <summary>
        /// Performs an ItemSearchRequest operation to ATCOM to retrieve the list of available parking offers and builds a response out of them.
        /// </summary>
        /// <param name="offer">Offer selected by the customer</param>
        /// <returns>List of available parking offers.</returns>
        Task<IList<AirportParkingItem>> GetAirportParkings(Offer offer);
    }
}
