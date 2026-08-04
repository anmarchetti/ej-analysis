#nullable enable
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository
{
    /// <summary>
    /// Booking service
    /// </summary>
    public interface IBookingRepository : IBookingValidator
    {
        /// <summary>
        /// Obtain booking details by booking reference.
        /// It doesn't validate request params, should be used varefully
        /// </summary>
        /// <param name="bookingReference">booking reference</param>
        /// <param name="supplierId">Supplier id</param>
        /// <returns>Stateful booking response</returns>
        Task<BookingResponse> GetBooking(string bookingReference, string supplierId = null);

        /// <summary>
        /// Obtain booking details by booking reference and BookingOptions
        /// </summary>
        /// <param name="bookingReference"></param>
        /// <param name="bookingOptions"></param>
        /// <returns></returns>
        Task<BookingResponse> GetBooking(string bookingReference, GetBookingOptions bookingOptions);

        /// <summary>
        /// Obtain booking details by booking reference.
        /// It doesn't validate request params, should be used varefully
        /// </summary>
        /// <param name="request">booking reference</param>
        /// <returns>Stateful booking response</returns>
        Task<BookingResponse> GetBooking(GetBookingRequest request);
        

        /// <summary>
        /// Get base booking details without amendment validation.
        /// </summary>
        /// <param name="bookingReference">Booking reference.</param>
        /// <param name="options" cref="GetBookingOptions"> Request booking options.</param>
        /// <returns>Base booking details from Atcom without validation.</returns>
        Task<BookingResponse> GetBaseBooking(string bookingReference, GetBookingOptions options = null);

        /// <summary>
        /// Obtain booking details by booking reference (return booking without status validation)
        /// </summary>
        /// <param name="bookingReference">booking reference</param>
        /// <param name="options">Options</param>
        /// <returns>Stateful booking response</returns>
        Task<BookingResponse> GetBookingUnsafe(string bookingReference, GetBookingOptions options = null);

        /// <summary>
        /// Cancel Booking by given booking reference using current language and market
        /// </summary>
        ///<param name="bookingReference">booking reference to be canceled</param>
        ///<param name="reason">booking cancellation reason</param>
        ///<param name="withoutFee">Whether cancellation fee should be included or not</param>
        /// <param name="promotionCollections">The promotion collection for the offer</param>
        /// <returns></returns>
        Task<BookingResponse> CancelBooking(string bookingReference, string reason, bool withoutFee, IList<string> promotionCollections = null);

        ///  <summary>
        ///  Cancel Booking by given booking reference using provided language and market
        ///  </summary>
        /// <param name="bookingReference">booking reference to be canceled</param>
        /// <param name="reason">booking cancellation reason</param>
        /// <param name="withoutFee">Whether cancellation fee should be included or not</param>
        /// <param name="marketCode">market code of the booking</param>
        /// <param name="language">language of the booking</param>
        ///  <param name="bookingPromotionKeys">the promotion of the booking</param>
        ///  <returns></returns>
        Task<BookingResponse> CancelBooking(string bookingReference, string reason, bool withoutFee, string marketCode, string language, IList<string> bookingPromotionKeys);

        /// <summary>
        /// Create booking without payment information
        /// </summary>
        /// <param name="request"></param>
        /// <param name="bookingReference"></param>
        /// <param name="sessionId"></param>
        /// <param name="requestId"></param>
        /// <returns></returns>
        Task<BookingResponse> StartBooking(BookingRequest request, string bookingReference, string sessionId, string requestId);

        /// <summary>
        /// Get booking memo by booking reference.
        /// </summary>
        /// <param name="bookingReference">Booking reference</param>
        /// <returns>Booking memo.</returns>
        Task<List<Memo>> GetBookingMemo(string bookingReference);

        /// <summary>
        /// Get booking memo by booking reference.
        /// </summary>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="predicate">Filter expression to get specific booking.</param>
        /// <returns>Booking memo.</returns>
        Task<List<Memo>> GetBookingMemo(string bookingReference, Func<Memo, bool> predicate);

        /// <summary>
        /// Add booking memo
        /// </summary>
        /// <param name="bookingReference"></param>
        /// <param name="memo"></param>
        /// <returns></returns>
        Task ModifyMemo(string bookingReference, BookingMemo memo);

        /// <summary>
        /// Add multiple booking memos
        /// </summary>
        /// <param name="bookingReference"></param>
        /// <param name="memos"></param>
        /// <returns></returns>
        Task ModifyMemo(string bookingReference, IEnumerable<BookingMemo> memos);

        /// <summary>
        /// Search by advanced parameters
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<AdvancedBookingSearchResponse> SearchBookings(AdvancedBookingSearchRequest request);

        /// <summary>
        /// Search bookings by cutomer id.
        /// Does no validation and should be used in secure context only
        /// </summary>
        /// <param name="customerId">Atcom customer id</param>
        /// <returns>Bookings</returns>
        Task<List<BookingResponse>> SearchBookings(string customerId, bool isAgentRequired);

        /// <summary>
        /// Update customer id for booking
        /// </summary>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="customerId">Customer id</param>
        /// <returns></returns>
        Task UpdateCustomerDetails(string bookingReference, string customerId);

        /// <summary>
        ///  Validate amendment booking request
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="amendRequest"></param>
        /// <param name="bookingResponse"></param>
        /// <param name="stateful"></param>
        /// <param name="sendExtraFlightInformationForInternalFlights"></param>
        /// <returns></returns>
        Task<ValidateAmendBookingResponse> ValidateAmendBookingInfo<T>(T amendRequest, BookingResponse bookingResponse,
            bool stateful, bool sendExtraFlightInformationForInternalFlights = false) where T : AmendInfoBookingRequest;

        /// <summary>
        /// Confirm booking modification
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<BookingResponse> CommitAmendBooking(BookingRequest request);

        /// <summary>
        /// Validate amend booking request.
        /// </summary>
        /// <param name="booking">Request</param>
        /// <param name="stateful"></param>
        /// <returns></returns>
        Task<ValidateAmendBookingResponse> GetValidateAmendBookingResponse(BookingResponse booking, bool stateful = false);
    }
}