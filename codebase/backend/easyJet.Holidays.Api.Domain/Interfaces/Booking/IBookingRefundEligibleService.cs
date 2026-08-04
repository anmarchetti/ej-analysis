using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    public interface IBookingRefundEligibleService
    {
        /// <summary>
        /// A booking can be converted to credit if:
        /// - Booking is in the future
        /// - Booking is active
        /// - Date of the change is between configured dates(so we can turn the functionality off in the future)
        /// - Booking departure date is between configured dates(so we can control which bookings can be converted)
        /// - Booking departure date is greater than X days from date of change(so the booking can’t be changed if it departs in less than the configured days)
        /// - Allow fully paid bookings to be converted(default to true)
        /// - Allow partially paid bookings to be converted(default to true)
        /// - Allow deposit only bookings to be converted(default to true)
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="customerDetails"></param>
        /// <returns></returns>        
        Task<EligibleForRefund> IsEligibleForFullRefund(BookingResponse booking, Data.Authentication.CustomerDetails customerDetails = null);

        /// <summary>
        /// Partial refunds have less strict eligibility rules than full refunds
        /// </summary>
        /// <returns></returns>
        Task<EligibleForRefund> IsEligibleForPartialRefund(BookingResponse booking, decimal amountToRefund, Data.Authentication.CustomerDetails customerDetails = null);

        /// <summary>
        /// Call centre partial refunds are a special case of partial refunds that always refund to the same credit type they were redeemed from
        /// </summary>
        /// <returns></returns>
        Task<EligibleForRefund> IsEligibleForCallCentrePartialRefund(BookingResponse booking, PaymentHistoryItem payment, Data.Authentication.CustomerDetails customerDetails, decimal amountToRefund);

        /// <summary>
        /// Build credits breakdown for refund: goodwill, refund, gift cards, promotions.
        /// The rule is:
        /// - Promotion credits: refund them individually(keep them separate from other credits)
        /// - Gift cards may be part of goodwill
        /// - Everything else goes to refund 
        /// </summary>
        /// <param name="booking">Booking details</param>
        /// <param name="rule">Refund rules</param>
        /// <param name="action">Refund action</param>
        /// <returns></returns>
        CreditBreakdown BuildCreditBreakdown(BookingResponse booking, RefundRules rule, EligibleAction action);

        /// <summary>
        /// Checks if the booking can be refunded
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="customerDetails"></param>
        /// <param name="isPartialRefund"></param>
        /// <returns></returns>
        Task<CanBeRefunded> CanBeRefunded(BookingResponse booking, Data.Authentication.CustomerDetails customerDetails = null, bool isPartialRefund = false);
    }
}