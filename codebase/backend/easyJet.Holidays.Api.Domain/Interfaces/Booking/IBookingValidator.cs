using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Booking validation interface
    /// </summary>
    public interface IBookingValidator
    {
        /// <summary>
        /// Execute Atcom VRP request to validate booking request (AtComRes/InfoBookingRequest)
        /// </summary>
        /// <param name="request">commit booking request</param>
        /// <param name="stateful">whether validate request is stateful</param>
        /// <param name="bookingRequest">booking request</param>
        /// <param name="skipPriceJumpValidation">Whethere price jumps erors shold be thrown</param>
        /// <returns></returns>
        Task<ValidateBookingResponse> Validate(ValidateBookingRequest request, bool stateful, BookingRequest bookingRequest = null, bool silenceTransferError = false, bool skipPriceJumpValidation = false);
    }
}
