using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies
{
    internal abstract class BaseRefundBreakdownStrategy(
        IInfoCancellationService infoCancellationService, 
        IFeeCalculator feeCalculator)
        : IRefundBreakdownStrategy
    {
        public abstract BookingCancellationReason BookingCancellationReason { get; }

        public abstract string PromotionName { get; }

        public abstract ushort Priority { get; }

        public abstract Task<BookingCancellationRefundBreakdown> GetCancellationRefundBreakdown(
            BookingResponse bookingResponse, decimal? feeToOverride, CancellationToken cancellationToken);

        public virtual bool ShouldRefund(BookingCancellationReason reason, List<string> promotionNames) => reason == BookingCancellationReason;

        protected async Task<decimal> GetBookingCancellationFee(BookingResponse bookingResponse, decimal? feeToOverride, bool hasMatchingDestinationRule)
        {
            //If the destination rule matches, we don't charge a cancellation fee
            if (hasMatchingDestinationRule)
            {
                return 0;
            }

            if (feeToOverride != null)
            {
                return feeToOverride.Value;
            }

            var infoCancellationResponse = await infoCancellationService.GetInfoCancellationAsync(bookingResponse);
            var feeAmount = infoCancellationResponse.CancellationFeeItem?.Amount ?? 0;
            if(ShouldCalculateFee(bookingResponse, feeAmount))
            {
                feeAmount = feeCalculator.CalculateFee(bookingResponse);
            }
            return feeAmount!;
        }
        
        protected static decimal GetAmendmentFee(BookingResponse bookingResponse, bool isAmendmentFeeEnabled, decimal? feeToOverride,
            bool hasMatchingDestinationRule)
        {
            if (!isAmendmentFeeEnabled)
            {
                return 0;
            }

            //If the destination rule matches, we don't charge a cancellation fee
            if (hasMatchingDestinationRule)
            {
                return 0;
            }

            //when fee override is set, we don't charge amendment fees because fee will be set by cancellation fee
            if (feeToOverride != null)
            {
                return 0;
            }

            var amendmentFee = bookingResponse.PaymentInfo?.AmendmentFeesItems?.Sum(i => i.Amount) ?? 0;
            return amendmentFee;
        }

        private static bool ShouldCalculateFee(BookingResponse bookingResponse, decimal feeAmount)
        {
            return bookingResponse.IsExternalAgency && feeAmount == 0;
        }
    }
}