using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Booking service
    /// </summary>
    public interface IBookingCreateService : IBookingValidator
    {
        /// <summary>
        /// Orchestrate payment and booking in atcom.
        /// Flow is like this:
        /// 1. Stateful InfoBooking Request
        /// 2. BookingRequest without payment details to obtain booking reference, which is required for Payment team
        /// 3. ModifyCustPaymentRequest – add the details of the authorised payment(s) to the booking
        /// 
        /// Error handling is implemented here as well. See more at CONF. TODO: update when Andrew finishes document, temp link is https://docs.google.com/document/d/1T5Jb1rQdQ6cJZHCFr6XfRDveFAJhuQD5e2bqfQkNAzw/edit?usp=sharing
        /// </summary>
        /// <param name="request">Booking Request</param>
        /// <returns></returns>
        Task<BookingResponse> Create(BookingRequest request);

        /// <summary>
        /// Orchestrate remaining balance payment:
        /// - Get booking details
        /// - Do payment
        /// - Update booking with payment details
        /// </summary>
        /// <param name="request">Request deatils</param>
        /// <returns>Booking model</returns>
        Task<BookingResponse> PayRemainingBalance(PayRemainingBalanceRequest request);
    }
}