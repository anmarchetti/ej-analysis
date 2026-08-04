using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    public interface IAmendBookingRefundService
    {
        /// <summary>
        /// Process partial refund of amend booking
        /// </summary>
        /// <returns>Amend booking response</returns>
        Task<BookingResponse> ProcessRefund(BookingRequest bookingRequest,
            ValidateAmendBookingResponse validateResponse, BookingResponse bookingResponse, ConvertType convertType);

        /// <summary>
        /// Get eligible for partial refund by amount
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<EligibleForRefund> EligibleForPartialRefund(AmendBookingPartialRefundRequest request);
    }
}
