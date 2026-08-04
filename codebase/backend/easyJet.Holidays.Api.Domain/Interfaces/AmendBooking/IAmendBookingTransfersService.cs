using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.Transfers;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    public interface IAmendBookingTransfersService
    {
        /// <summary>
        /// Get amend transfers price
        /// </summary>
        /// <param name="amendBookingTransfersRequest"></param>
        /// <returns></returns>
        Task<AmendBookingTransfersResponse> GetAmendTransfersPrice(AmendBookingTransfersRequest amendBookingTransfersRequest);

        /// <summary>
        /// Get alternative transfers with amendment price
        /// </summary>
        /// <param name="alternativeTransfersSearchRequest"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        Task<AmendBookingTransfersResponse> GetAlternativeTransfersWithPrice(AlternativeTransfersSearchRequest alternativeTransfersSearchRequest);

        /// <summary>
        /// Get Alternative transfer options for amend date flow.
        /// </summary>
        /// <param name="request">Current offer state for amend dates flow.</param>
        /// <returns>Available offers.</returns>
        Task<IEnumerable<AmendDatesOffer>> GetAlternativeTransfers(AmendDatesOffer request);
    }
}