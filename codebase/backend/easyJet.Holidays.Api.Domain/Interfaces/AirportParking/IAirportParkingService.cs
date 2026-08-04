using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces.AirportParking
{
    /// <summary>
    /// Handles airport parking-related operations.
    /// </summary>
    public interface IAirportParkingService
    {
        /// <summary>
        /// Search for all available parkings.
        /// </summary>
        /// <param name="offer">Offer selected by the customer.</param>
        /// <returns><see cref="AirportParkingResponse"/> object with all information necessary by the controller.</returns>
        public Task<AirportParkingResponse> Search(Offer offer);

        /// <summary>
        /// For each offer in the input list, this method will execute one request to Atcom and another to Holiday Extras to fetch all the information necessary and
        /// fulfill the <see cref="AirportParkingItem"/> with it.
        /// </summary>
        /// <param name="offers">List of offers. Typically one.</param>
        /// <param name="productCode">Parking code to be used to fetch the information from the different services.</param>
        /// <returns></returns>
        Task EnrichOffersWithParking(IList<Offer> offers, string productCode);

        /// <summary>
        /// Enrich airportParkingItem with holidays extra information
        /// </summary>
        /// <param name="airportParkingItem">airportParkingItem returned from the booking</param>
        Task EnrichBookingWithAirportParking(AirportParkingItem airportParkingItem);
    }
}