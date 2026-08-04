using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.ErrataInfo;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo
{
    public interface IErrataInfoService
    {
        /// <summary>
        /// Save list of ErrataInfoModels in DynamoDB table
        /// </summary>
        /// <param name="data">Items for saving in DynamoDb </param>
        /// <returns></returns>
        Task Save(List<HotelErrataModel> data);

        /// <summary>
        /// Save list of FlightErrataInfoModels in DynamoDB table
        /// </summary>
        /// <param name="data">Items for saving in DynamoDb </param>
        /// <returns></returns>
        Task SaveFlightErrata(List<FlightErrataModel> data);

        /// <summary>
        /// Set errata info for each offer
        /// </summary>
        /// <param name="offers">list of offer for which need to set up errata info</param>
        /// <param name="language">errata's language</param>
        /// <returns></returns>
        Task EnrichWithErrataInfo(List<Offer> offers, string language);

        /// <summary>
        /// Set errata info for offer
        /// </summary>
        /// <param name="offer">offer for which need to set up errata info</param>
        /// <param name="language">errata's language</param>
        /// <returns></returns>
        Task EnrichWithErrataInfo(Offer offer, string language);

        /// <summary>
        /// Get arrata info
        /// </summary>
        /// <param name="language">errata's language</param>
        /// <param name="offerDate">Offer start date</param>
        /// <param name="codes">Accom or Geography codes</param>
        /// <returns>List of errata messages.</returns>
        Task<string[]> GetErrataInfo(string language, DateTime? offerDate, params string[] codes);

        /// <summary>
        /// Set flight errata info to transport
        /// </summary>
        /// <param name="offers">list of offer for which need to set up errata info</param>
        /// <param name="language">errata's language</param>
        /// <returns></returns>
        Task EnrichWithFlightErrataInfo(List<Offer> offers, string language);

        /// <summary>
        /// Set flight errata info to bookings transport
        /// </summary>
        /// <param name="booking">booking resposne to set its errata</param>
        /// <param name="language">errata's language</param>
        /// <returns></returns>
        Task EnrichWithFlightErrataInfo(BookingResponse booking, string language);

        /// <summary>
        /// Enriches the bookings with flight errata information.
        /// </summary>
        /// <param name="transport">The amend transport.</param>
        /// <param name="language">errata's language</param>
        /// <returns></returns>
        Task EnrichWithFlightErrataInfo<T>(T transport, string language) where T : Transport;

        /// <summary>
        /// Delete all errata fom DynamoDb
        /// </summary>
        /// <returns></returns>
        Task DeleteOldErrata();

        /// <summary>
        /// Delete all flight errata fom DynamoDb
        /// </summary>
        /// <returns></returns>
        Task DeleteOldFlightErrata();

        /// <summary>
        /// Generates the Flight Errata DynamoDb Code
        /// </summary>
        /// <returns></returns>
        string GenerateFlightErrataCode(string departurePoint, string arrivalPoint);

        /// <summary>
        /// Maps Errata language to matching language code
        /// </summary>
        /// <returns></returns>
        IEnumerable<string> MapLanguageCode(string languageCode);
    }
}
