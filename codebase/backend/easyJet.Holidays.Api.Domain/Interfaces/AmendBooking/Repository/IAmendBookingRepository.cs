using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository
{
    /// <summary>
    /// Defines the contract for a repository that handles 
    /// retrieval and validation of amended booking information.
    /// </summary>
    public interface IAmendBookingRepository
    {
        /// <summary>
        /// Retrieves and validates a response for an amended booking.
        /// </summary>
        /// <remarks>
        /// Uses reference data (such as benefits) and a built InfoModifyBooking request
        /// to fetch the amended booking response from the external API. If <paramref name="stateful"/>
        /// is set to <c>false</c>, the session state is discarded. Catches exceptions and returns
        /// <see langword="null" /> in the event of an error.
        /// </remarks>
        /// <param name="booking">The original booking details used to build the request.</param>
        /// <param name="stateful">
        /// Indicates whether session state should be maintained (<c>true</c>) or discarded (<c>false</c>).
        /// Default is <c>false</c>.
        /// </param>
        /// <returns>
        /// A <see cref="ValidateAmendBookingResponse"/> containing the amended booking validation results,
        /// or <see langword="null"/> if an exception occurs.
        /// </returns>
        Task<ValidateAmendBookingResponse> GetValidateAmendBookingResponse(BookingResponse booking, bool stateful = false);
    }
}