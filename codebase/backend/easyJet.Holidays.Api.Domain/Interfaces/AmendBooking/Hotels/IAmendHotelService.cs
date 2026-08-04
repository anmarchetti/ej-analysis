using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Hotels
{
    /// <summary>
    /// Service for hotel change
    /// </summary>
    public interface IAmendHotelService
    {
        /// <summary>
        /// Validate cached offer in atcom VRP
        /// </summary>
        /// <param name="request">Offer from cache</param>
        /// <returns>Validated offer</returns>
        Task<AmendHotelResponse> ValidateAlternativeHotel(AmendHotelRequest request);

        /// <summary>
        /// Get alternative rooms and board for new hotel from tp 26
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<GetAmendHotelRoomsResponse> GetAlternativeRooms(AmendHotelRequest request);

        /// <summary>
        ///  Get alternative transfers for new hotel 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<IEnumerable<AmendHotelResponse>> GetAlternativeTransfers(AmendHotelRequest request);
        /// <summary>
        /// Get alternative hotel list for current booking from Atcom cache.
        /// </summary>
        /// <param name="request" cref="GetAmendHotelListRequest">Request with filter information.</param>
        /// <returns cref="GetAmendHotelListResponse">Alternative hotels list with filter metadata.</returns>
        Task<GetAmendHotelListResponse> GetAmendHotelList(GetAmendHotelListRequest request);
    }
}