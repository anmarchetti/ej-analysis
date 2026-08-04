using easyJet.Holidays.Api.Domain.Data.CallCentre;
using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Services.CallCentre
{
    public interface ICallCentreService
    {
        /// <summary>
        /// Add credits to user account
        /// </summary>
        /// <param name="request">Add credits request</param>
        /// <returns>Customer credits</returns>
        Task<MyCreditInfo> AddCredit(AddCreditsRequest request);

        /// <summary>
        /// Redeem user credits. Will be assinge to booking from request
        /// </summary>
        /// <param name="request">Spend credits request</param>
        /// <returns>Leed passenger credits</returns>
        Task<MyCreditInfo> SpendCredit(SpendCreditRequest request);

        /// <summary>
        /// Convert valid booking to credits. Credits will be accignt to lead passenger.
        /// </summary>
        /// <param name="request">Convert booking request</param>
        /// <returns>Leed passenger credits</returns>
        Task<MyCreditInfo> CreditBooking(CreditBookingRequest request);

        /// <summary>
        /// Get user credits by email.
        /// </summary>
        /// <param name="email">Customer email address</param>
        /// <param name="customerId">Customer ID</param>
        /// <param name="force">Get credits from cahe or from voucherify.</param>
        /// <returns>Customer credits</returns>
        Task<MyCreditInfo> GetCredit(string email, string currency, string customerId = null, bool force = false);

        /// <summary>
        /// Issues credit refund (if possible) with same reason as payment with provided PaymentId
        /// </summary>
        Task<CallCentrePartialRefundResponse> PartialRefund(CallCentrePartialRefundRequest request);
    }
}
