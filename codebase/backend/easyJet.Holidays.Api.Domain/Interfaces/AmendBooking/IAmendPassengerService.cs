using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    public interface IAmendPassengerService
    {
        /// <summary>
        /// Validate amend name by rules.
        /// </summary>
        /// <param name="amendNameRequest">Passenger details.</param>
        /// <returns></returns>
        Task<bool> ValidatePaxNameChange(AmendPaxRequest amendNameRequest);

        /// <summary>
        /// Validate amend name by rules.
        /// </summary>
        /// <param name="booking">Booking information</param>
        /// <param name="amendPersonWithDetails">Passanger details</param>
        /// <returns></returns>
        Task<bool> ValidatePaxNameChange(BookingResponse booking,
            IEnumerable<AmendPersonWithDetails> amendPersonWithDetails);

        /// <summary>
        /// Validate availability to amend passengers details by sitecore change amount limit settings.
        /// </summary>
        /// <param name="amendPaxRequest">Request with bookingRef and passenger detail information.</param>
        /// <returns>Flag for each passenger in request.</returns>
        /// <exception cref="ArgumentNullException">Passanger information can not be null.</exception>
        Task<IEnumerable<AmendPaxValidationResponse>> ValidatePaxChangeLimit(AmendPaxValidationRequest amendPaxRequest);
    }
}