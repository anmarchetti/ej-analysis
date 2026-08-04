using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Constants;

namespace easyJet.Holidays.Api.Domain.Utils
{
    /// <summary>
    /// Utils for booking operations
    /// </summary>
    public class BookingUtils
    {
        /// <summary>
        /// Update AllowPayBalanceDueDate in bookinf response
        /// </summary>
        /// <param name="bookingResponse">Booking reference info</param>
        /// <param name="allowPayOutstandingBalanceInDays">days to disable pay remaining balance</param>
        public static void EnrichAllowPayBalanceDueDate(BookingResponse bookingResponse, int allowPayOutstandingBalanceInDays)
        {
            var departureDate = bookingResponse?.Package?.Transport?.Routes?.FirstOrDefault(x => x.Direction == Direction.Outbound)?.DepDate;
            departureDate = departureDate?.AddDays(-allowPayOutstandingBalanceInDays);

            if (bookingResponse?.PaymentInfo != null)
            {
                bookingResponse.PaymentInfo.AllowPayBalanceDueDate = departureDate ?? bookingResponse.PaymentInfo.BalanceDueDate;
                bookingResponse.PaymentInfo.AllowPayOutstandingBalanceDays = allowPayOutstandingBalanceInDays;
            }
        }

        /// <summary>
        /// Check if user can pay remaining balance for the booking 
        /// </summary>
        /// <param name="bookingResponse">Booking response info</param>
        /// <param name="allowPayOutstandingBalanceInDays">days to disable pay remaining balance</param>
        /// <returns></returns>
        public static bool CanPayOutstandingBalance(BookingResponse bookingResponse, int allowPayOutstandingBalanceInDays)
        {
            EnrichAllowPayBalanceDueDate(bookingResponse, allowPayOutstandingBalanceInDays);
            var date = bookingResponse?.PaymentInfo?.AllowPayBalanceDueDate;
            if (date == null)
            {
                return false;
            }

            var now = DateTimeOffset.Now;
            // Compare only year day and month
            return date?.Year == now.Year && date?.Month == now.Month && date?.Day == now.Day;
        }

        /// <summary>
        /// Validate offer date based on app settings.
        /// It may be not allowed to book package for today and tomorrow.
        /// </summary>
        /// <param name="date">Offer start date</param>
        /// <param name="disabledOffersForNextDay">Disable offers for the next day</param>
        /// <returns>True for valid package</returns>
        public static bool IsPackageDateValid(DateTime? date, bool disabledOffersForNextDay)
        {
            if (!disabledOffersForNextDay) return true;

            if (date.HasValue)
            {
                var now = DateTimeOffset.UtcNow.Date;
                var minimalValiDate = now.AddDays(2); // Today is 2 Jan 15:00. Min valid date will be not today & tomorrow: 4 Jan 00:00
                return date >= minimalValiDate;
            }
            return false;
        }

        /// <summary>
        /// Get booking deposit.
        /// If it's zero we calculate it as 60*guests
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="defaultDepositPerPerson"></param>
        /// <returns></returns>
        public static decimal BookingDeposit(BookingResponse booking, decimal defaultDepositPerPerson)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return BookingDeposit(booking.PaymentInfo, booking.Guests, defaultDepositPerPerson);
        }

        /// <summary>
        /// Get booking deposit.
        /// If it's zero we calculate it as 60*guests
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="defaultDepositPerPerson"></param>
        /// <returns></returns>
        public static decimal BookingDeposit(ValidateBookingResponse booking, decimal defaultDepositPerPerson)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return BookingDeposit(booking.PaymentInfo, booking.Guests, defaultDepositPerPerson);
        }

        /// <summary>
        /// Get booking deposit.
        /// If it's zero we calculate it as 60*guests
        /// </summary>
        /// <param name="paymentInfo"></param>
        /// <param name="guests"></param>
        /// <param name="defaultDepositPerPerson"></param>
        /// <returns></returns>
        private static decimal BookingDeposit(PriceInfo paymentInfo, List<PersonWithDetails> guests, decimal defaultDepositPerPerson)
        {
            if (paymentInfo.DepositPrice > 0)
            {
                return paymentInfo.DepositPrice;
            }

            var nonInfants = guests?.Where(x => x.Type != Data.Guests.PersonType.Infant)?.Count() ?? 0;
            return nonInfants * defaultDepositPerPerson;
        }

        /// <summary>
        ///  Total paid money: total paid minus total refunded
        ///  If it's more than booking price it returns booking price
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal BookingValue(BookingResponse booking)
        {
            var bookingPrice = booking?.PaymentInfo?.TotalPrice ?? 0;
            var paid = booking?.PaymentInfo?.PaymentHistory?.Sum(x => x.Amount) ?? 0;
            if (paid > bookingPrice)
            {
                paid = bookingPrice;
            }

            return paid;
        }

        /// <summary>
        /// Get amount paid by credits(all)
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal CreditAmount(BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return booking.PaymentInfo?.PaymentHistory.Where(x => x.IsCredit).Sum(x => x.Amount) ?? 0;
        }

        /// <summary>
        /// Get amount paid by credits or 0 if negative value
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal NonNegativeCreditAmount(BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return Math.Max(booking.PaymentInfo?.PaymentHistory.Where(x => x.IsCredit).Sum(x => x.Amount) ?? 0, 0);
        }

        /// <summary>
        /// Get amount paid by cash
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal TotalCash(BookingResponse booking)
        {
            return TotalCash(BookingValue(booking), booking);
        }

        /// <summary>
        /// Get amount paid by cash
        /// </summary>
        /// <param name="bookingValue"></param>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal TotalCash(decimal bookingValue, BookingResponse booking)
        {
            return bookingValue - NonNegativeCreditAmount(booking);
        }

        /// <summary>
        /// Get amount paid by gift cards
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal GiftCardsAmount(BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return booking.PaymentInfo?.PaymentHistory?.Where(x => x.IsGiftCardCredit).Sum(x => x.Amount) ?? 0;
        }

        /// <summary>
        /// Get amount paid by goodwill credit
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal GoodWillAmount(BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return booking.PaymentInfo?.PaymentHistory?.Where(x => x.IsGoodWill).Sum(x => x.Amount) ?? 0;
        }

        /// <summary>
        /// Get amount paid by onetime credit
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal OneTimeUseCreditAmount(BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return booking.PaymentInfo?.PaymentHistory?.Where(x => x.IsOneTimeUseCredit).Sum(x => x.Amount) ?? 0;
        }

        /// <summary>
        /// Promo credits amount
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal PromoCreditsAmount(BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return booking.PaymentInfo?.PaymentHistory?.Where(x => x.IsPromoCredit).Sum(x => x.Amount) ?? 0;
        }

        public static decimal PromoCreditsAmount(BookingResponse booking, IReadOnlyCollection<string> paymentCodes)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return booking.PaymentInfo?.PaymentHistory?.Where(x => x.IsPromoCredit && paymentCodes.Contains(x.PayMethodCode)).Sum(x => x.Amount) ?? 0;
        }

        /// <summary>
        /// Refund credits amount
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal RefundCreditsAmount(BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return booking.PaymentInfo?.PaymentHistory?.Where(x => x.IsCredit && !x.IsPromoCredit && !x.IsGiftCardCredit && !x.IsOneTimeUseCredit).Sum(x => x.Amount) ?? 0;
        }

        /// <summary>
        /// Collects all credits except promo, giftcard, goodwill, one time use
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static decimal OtherCreditsAmount(BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return booking.PaymentInfo?.PaymentHistory?.Where(x => x.IsCredit && !x.IsGoodWill && !x.IsPromoCredit && !x.IsGiftCardCredit && !x.IsOneTimeUseCredit).Sum(x => x.Amount) ?? 0;
        }

        public static decimal CreditsAndCashAmount(BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(booking);
            return booking.PaymentInfo?.PaymentHistory?.Where(x => !x.IsPromoCredit && !x.IsGiftCardCredit && !x.IsGoodWill && !x.IsOneTimeUseCredit).Sum(x => x.Amount) ?? 0;
        }

        /// <summary>
        ///  Cash amount paid as part of deposit.
        /// Here we treat as deposit payment in historical order.
        /// e.g. booking for 2 people. Every person needs to pay 60 for deposit. So in total we need 120 deposit. if customer paid 100 with cash and then 100 with credit, then all 100 cash will be part of deposit
        /// on the other hand 100 credit + 100 cash means that only 20 cash goes to deposit 
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="deposit">Deposit amount</param>
        /// <returns></returns>
        public static decimal CashAmountInDeposit(BookingResponse booking, decimal deposit)
        {
            var cash = 0m;
            var originalDepositValue = deposit;

            /*
             * We need to reorder payments to calculate cash amount which should be part of deposit:
             *  - keep natural order until we reached deposit
             *  - everything else should be in order: refund, giftcard, cash 
             */
            var paymentsHistory = (booking?.PaymentInfo?.PaymentHistory ?? Array.Empty<PaymentHistoryItem>())
                .ToList();
            var reorderedHistory = new List<PaymentHistoryItem>();
            decimal total = 0;
            var processed = 0;
            while (total < deposit && processed < paymentsHistory.Count)
            {
                total += paymentsHistory[processed].Amount;
                reorderedHistory.Add(paymentsHistory[processed]);
                processed++;
            }

            var remainingPayments = paymentsHistory.GetRange(processed, paymentsHistory.Count - processed);
            reorderedHistory.AddRange(remainingPayments.OrderBy(x =>
            {
                if (x.IsGiftCardCredit) return 1; // gift cards go 2nd
                if (!x.IsCredit) return 2; // cash is the last
                return 0; // everything else should be picked up first
            }));

            reorderedHistory = reorderedHistory
                .Where(x => !x.IsPromoCredit)
                .ToList(); // we treat promo credits as "special type" and we ignore it here

            var i = 0;
            while (deposit > 0 && i < reorderedHistory.Count)
            {
                var payment = reorderedHistory[i];
                deposit -= payment.Amount;
                i++;

                if (!payment.IsCredit)
                {
                    cash += payment.Amount;
                    if (deposit < 0)
                    {
                        // If deposit is 120 and we have 2 payments: 100cred & 100 cash
                        // we want to include only 20 from cash payment. This line does it
                        cash += deposit;
                    }
                }
            }

            if (cash > originalDepositValue)
            {
                cash = originalDepositValue;
            }

            return cash;
        }

        /// <summary>
        /// Calculate days to departure
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static double DaysToDeparture(BookingResponse booking)
        {
            var outboundRoute = booking?.Package?.Transport?.OutboundFlight;
            var daysBeforeDeparture = (outboundRoute?.DepDate - DateTime.UtcNow)?.TotalDays;
            if (!daysBeforeDeparture.HasValue)
                throw new InvalidOperationException("Cannot calculate days to departure. OutboundRoute depDate must be null!");

            return daysBeforeDeparture.Value;
        }

        /// <summary>
        /// Checks if the booking response is a Flight + Hotel booking based on promotion collections.
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <returns></returns>
        public static bool IsFlightAndHotelBooking(BookingResponse bookingResponse)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);

            if (bookingResponse.PromotionCollections == null || bookingResponse.PromotionCollections.Count == 0)
            {
                return false;
            }

            return bookingResponse.PromotionCollections.Any(pc =>
                string.Equals(pc, ExperienceContextProviderConstants.FlightPlusHotel, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Checks if the booking response is a luxury booking based on promotion collections.
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <returns></returns>
        public static bool IsLuxuryBooking(BookingResponse bookingResponse)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);

            if (bookingResponse.PromotionCollections == null || bookingResponse.PromotionCollections.Count == 0)
            {
                return false;
            }

            // Check if any of the promotion collections in the booking response match the luxury collections
            return bookingResponse.PromotionCollections.Any(pc => pc == "lux");
        }
    }
}
