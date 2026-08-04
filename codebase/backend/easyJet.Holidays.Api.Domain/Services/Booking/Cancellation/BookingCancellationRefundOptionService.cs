using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Utils;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation
{
    /// <inheritdoc />
    public class BookingCancellationRefundOptionService(ISettingsService settingsService) : IBookingCancellationRefundOptionService
    {
        private const int FallbackDaysBeforeDepartureToShowOnlyOriginalPaymentMethod = 27;

        /// <inheritdoc />
        public async Task<BookingCancellationRefundOption> GetRefundOption(BookingResponse bookingResponse, BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown, BookingCancellationReason bookingCancellationReason)
        {
            ArgumentNullException.ThrowIfNull(bookingCancellationRefundBreakdown);
            ArgumentNullException.ThrowIfNull(bookingResponse);

            if (bookingCancellationRefundBreakdown.TotalRefundAmount <= 0)
            {
                return BookingCancellationRefundOption.None;
            }

            var cancelCreditSettings = await settingsService.GetCancelCreditSettings();
            
            if (ShowOnlyOriginalPaymentMethod(bookingResponse, bookingCancellationRefundBreakdown.DaysBeforeDeparture, cancelCreditSettings, bookingCancellationReason))
            {
                if (ShouldOnlyRefundCredit(bookingCancellationRefundBreakdown.TotalRefundAmount, bookingCancellationRefundBreakdown.CreditRefundAmount))
                {
                    return BookingCancellationRefundOption.CreditOnly;
                }

                return BookingCancellationRefundOption.OriginalPayment;
            }

            if (IsPaidByCash(bookingCancellationRefundBreakdown.CashRefundAmount))
            {
                return BookingCancellationRefundOption.CreditAndOriginalPayment;
            }

            return BookingCancellationRefundOption.CreditOnly;
        }
        
        private static bool IsPaidByCash(decimal totalCash)
        {
            return totalCash > 0;
        }

        private static bool ShowOnlyOriginalPaymentMethod(BookingResponse bookingResponse, double daysBeforeDeparture,
            CreditAndCashRefundSettings cancelCreditSettings, BookingCancellationReason bookingCancellationReason)
        {
            //For flight + hotel package, we always show original payment refund info in order to align with flight refund policy, no matter how many days before departure
            var promotionCollection = bookingResponse.PromotionCollections ?? new List<string>();
            if (promotionCollection.Contains(ExperienceContextProviderConstants.FlightPlusHotel, StringComparer.OrdinalIgnoreCase))
            {
                return true;
            }

            //TradeBookings only paid via cash. So we only show original payment refund info
            if (bookingCancellationReason == BookingCancellationReason.TradeLed || bookingResponse.IsExternalAgency)
            {
                return true;
            }
            
            var showOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture =
                cancelCreditSettings?.ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture ??
                FallbackDaysBeforeDepartureToShowOnlyOriginalPaymentMethod;

            return Math.Floor(daysBeforeDeparture) <= showOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture &&
                   bookingCancellationReason == BookingCancellationReason.CustomerLed;
        }

        private static bool ShouldOnlyRefundCredit(decimal totalRefundAmount, decimal creditRefundAmount)
        {
            return totalRefundAmount == creditRefundAmount;
        }
    }
}
