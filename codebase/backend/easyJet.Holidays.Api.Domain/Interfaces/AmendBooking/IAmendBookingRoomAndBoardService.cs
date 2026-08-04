using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    /// <summary>
    /// Interface from amending bookings room and board 
    /// </summary>
    public interface IAmendBookingRoomAndBoardService
    {
        /// <summary>
        /// Get Room and Board available offers from atcom cache 
        /// </summary>
        /// <param name="bookingReference"></param>
        /// <returns></returns>
        Task<AmendRoomVariantsResponse> GetAvailableRoomAndBoards(string bookingReference);

        /// <summary>
        /// Validate room variant with InfoBookingModifyRequest
        /// </summary>
        /// <param name="request" cref="AmendRoomValidationRequest">Request</param>
        /// <returns cref="IEnumerable{AmendRoomVariant}">Room variant with calculated price and promocode.</returns>
        Task<IEnumerable<AmendRoomVariant>> ValidateAlternativeRoomAndBoard(AmendRoomValidationRequest request);
    }
}
