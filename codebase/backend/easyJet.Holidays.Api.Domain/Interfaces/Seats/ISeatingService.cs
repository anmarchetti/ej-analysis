using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Seats;
using Seat = easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings.Seat;

namespace easyJet.Holidays.Api.Domain.Interfaces.Seats
{
    /// <summary>
    /// FlightOnly seats service
    /// </summary>
    public interface ISeatingService
    {
        /// <summary>
        /// Getting seats map by specified query string params
        /// </summary>
        /// <param name="request"></param>
        /// <param name="includeOnlyProductCodes">If true, only product codes will be included in the response, no descriptions, icons, etc.</param>
        /// <returns>Search response JSON string</returns>
        Task<GetSeatsMapResponse> GetSeatsMap(GetSeatsMapRequest request, bool includeOnlyProductCodes = false);

        /// <summary>
        /// Returns the same response as <see cref="GetSeatsMap"/> but retrieves if first from cache
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<List<Seat>> GetCachedSeatsMap(GetSeatsMapRequest request);

        /// <summary>
        /// Returns the same response as <see cref="GetSeatsMap"/> but retrieves if first from cache
        /// </summary>
        /// <param name="route"></param>
        /// <param name="currencyCode"></param>
        /// <returns></returns>
        Task<List<Seat>> GetCachedSeatsMap(Route route, string currencyCode);

        /// <summary>
        /// Returns seat information (price, price band, products, etc.) from cache for the specified seat numbers and route
        /// </summary>
        /// <param name="route"></param>
        /// <param name="currencyCode"></param>
        /// <param name="seatNumbers"></param>
        /// <param name="prom"></param>
        /// <returns></returns>
        Task<SeatMap> GetCachedSeatsInfo(Route route, string currencyCode, IList<string> seatNumbers, string prom);

        /// <summary>
        /// Adds seats prices and other information from the B2B API for the specified seats to offers
        /// </summary>
        /// <param name="offers">Offers to enrich with seats data</param>
        /// <param name="outboundSeatNumbers">Selected seats for the outbound flights</param>
        /// <param name="inboundSeatNumbers">Selected seats for the inbound flights</param>
        /// <returns></returns>
        Task EnrichWithCachedSeatsInfo(List<Offer> offers, List<string> outboundSeatNumbers, List<string> inboundSeatNumbers);
    }
}