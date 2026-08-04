#nullable enable

using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Service which handles all booking cancellations
    /// </summary>
    public interface IBookingCancellationService
    {
        /// <summary>
        /// Get cancellation summary
        /// </summary>
        /// <param name="bookingCancellationSummaryRequest"></param>
        /// <param name="bookingCancellationReason"></param>
        /// <param name="feeToOverride"></param>
        /// <param name="isSharedServiceCall"></param>
        /// <param name="skipLeadPassengerCheck"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        Task<CancellationSummaryResponse> GetCancellationSummary(
            BookingCancellationSummaryRequest bookingCancellationSummaryRequest,
            BookingCancellationReason bookingCancellationReason, decimal? feeToOverride, 
            bool isSharedServiceCall, bool skipLeadPassengerCheck, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Cancel booking
        /// </summary>
        /// <param name="bookingCancellationRequest"></param>
        /// <param name="bookingCancellationReason"></param>
        /// <param name="feeToOverride">Fee to override. This fee will be used instead this from Atcom </param>
        /// <param name="isSharedServiceCall"></param>
        /// <param name="skipLeadPassengerCheck"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        Task<CancellationExtendedResponse> CancelBooking(BookingCancellationRequest bookingCancellationRequest,
            BookingCancellationReason bookingCancellationReason, decimal? feeToOverride, 
            bool isSharedServiceCall, bool skipLeadPassengerCheck, 
            CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Cancellation reason
    /// </summary>
    public enum BookingCancellationReason
    {
        /// <summary>
        /// Cancellation led by customer
        /// </summary>
        CustomerLed,

        /// <summary>
        /// Cancellation led by easyJey
        /// </summary>
        EasyJetLed,

        /// <summary>
        /// Cancellation led by trade
        /// </summary>
        TradeLed
    }

    /// <summary>
    /// Cancellation reason
    /// </summary>
    public enum CancellationReason
    {
        /// <summary>
        /// Customer cancellation
        /// </summary>
        CustomerCancellation,

        /// <summary>
        /// Bereavement
        /// </summary>
        Bereavement,

        /// <summary>
        /// Significant change disruption
        /// </summary>
        SignificantChangeDisruption,

        /// <summary>
        /// Significant change overbooking
        /// </summary>
        SignificantChangeOverbooking,

        /// <summary>
        /// Illness
        /// </summary>
        Illness,

        /// <summary>
        /// Fraud
        /// </summary>
        Fraud,
        
        /// <summary>
        /// Non Payment
        /// </summary>
        NonPayment,
        
        /// <summary>
        /// Test Booking
        /// </summary>
        TestBooking,
    }
}