using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Settings;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    public class BookingRefundEligibleService : IBookingRefundEligibleService
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly ILogger<BookingCreditService> _logger;
        private readonly ApiSettings _apiSettings;
        private readonly ISettingsService _settingsService;
        private readonly VoucherSettings _voucherSettings;
        private readonly IApiSettingsService _apiSettingsService;

        public BookingRefundEligibleService(
            IOptions<ApiSettings> apiSettings,
            IAuthenticationService authenticationService,
            ILogger<BookingCreditService> logger,
            ISettingsService settingsService,
            IApiSettingsService apiSettingsService
            )
        {
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _voucherSettings = apiSettings?.Value?.Vouchers ?? throw new ArgumentNullException(nameof(apiSettings));
            _authenticationService = authenticationService;
            _logger = logger;
            _settingsService = settingsService;
            _apiSettingsService = apiSettingsService;
        }


        /// <inheritdoc />
        public async Task<EligibleForRefund> IsEligibleForFullRefund(BookingResponse booking, Data.Authentication.CustomerDetails customerDetails = null)
        {
            ArgumentNullException.ThrowIfNull(booking);
            var model = await BuildEligibleForRefund(booking, customerDetails);

            if (model.Status == RefundStatus.Ok && model.Rules != RefundRules.NoRefund && model.Rules != RefundRules.PartialRefund)
            {
                if (model.Credit.IsEligible)
                {
                    model.Credit.CreditBreakdown = BuildCreditBreakdown(booking, model.Rules, model.Credit);
                    CheckIfCreditIsLost(booking, model);
                }

                if (model.Refund.IsEligible)
                {
                    model.Refund.CreditBreakdown = BuildCreditBreakdown(booking, model.Rules, model.Refund);
                }
            }

            RoundPriceToTwoDigits(model);
            return model;
        }

        // Adding credits, after cancellation of which credits are lost.
        private void CheckIfCreditIsLost(BookingResponse booking, EligibleForRefund eligibleForRefundModel)
        {
            var credits = booking.PaymentInfo.PaymentHistory
                                             .Where(c => c.IsCredit)
                                             .Select(c => _apiSettingsService.GetPaymentCodesSettingsByPaymentCode(c.PayMethodCode))
                                             .Where(s => s.ExpirationDate != null && s.ExpirationDate < DateTime.UtcNow)
                                             .Select(s => s.Reason);

            if (credits.Any())
            {
                eligibleForRefundModel.Credit.LostCreditsIfCancelled = credits.ToList();
            }
        }

        public async Task<EligibleForRefund> IsEligibleForPartialRefund(BookingResponse booking, decimal amountToRefund, Data.Authentication.CustomerDetails customerDetails = null)
        {
            var model = await BuildEligibleForPartialRefund(booking, amountToRefund, customerDetails);

            if (model.Status == RefundStatus.Ok && model.Rules == RefundRules.PartialRefund)
            {
                if (model.Credit.IsEligible)
                {
                    model.Credit.CreditBreakdown = BuildPartialRefundCreditBreakdown(booking, model.Rules, model.Credit);
                }

                if (model.Refund.IsEligible)
                {
                    model.Refund.CreditBreakdown = BuildPartialRefundCreditBreakdown(booking, model.Rules, model.Refund);
                }
            }

            RoundPriceToTwoDigits(model);
            return model;
        }

        public async Task<EligibleForRefund> IsEligibleForCallCentrePartialRefund(BookingResponse booking,
            PaymentHistoryItem payment, Data.Authentication.CustomerDetails customerDetails, decimal amountToRefund)
        {
            var disabledByRules = new EligibleForRefund
            {
                Credit = new EligibleAction { IsEligible = false },
                Refund = new EligibleAction { IsEligible = false },
                Status = RefundStatus.DisabledByRules,
                Rules = RefundRules.NoRefund
            };

            var refundAvailable = await CanBeRefunded(booking, customerDetails, true);

            if (!refundAvailable.IsEnabled)
            {
                _logger.LogInformation("Refund disabled by rules");
                return disabledByRules;
            }

            var isEligible = false;
            CreditBreakdown breakdown = null;

            //while we are doing this refund based on payment reason, this prevents refunding more than specified payment
            //(however it doesn't take into account possible existing refunds for this payment)
            //it also prevents refunds from refund payments since they have negative value in Amount 
            if (amountToRefund > payment.Amount)
            {
                return disabledByRules;
            }

            if (payment.IsGiftCardCredit)
            {
                var giftCardValue = BookingUtils.GiftCardsAmount(booking);
                if (giftCardValue >= amountToRefund)
                {
                    isEligible = true;
                    breakdown = new CreditBreakdown { GiftCard = amountToRefund };
                }
            }
            else if (payment.IsGoodWill)
            {
                var goodwillValue = BookingUtils.GoodWillAmount(booking);
                if (goodwillValue >= amountToRefund)
                {
                    isEligible = true;
                    breakdown = new CreditBreakdown { Goodwill = amountToRefund };
                }
            }
            else if (payment.IsPromoCredit)
            {
                var settings = _apiSettingsService.GetPaymentCodesSettingsByPaymentCode(payment.PayMethodCode);
                var promoValue = BookingUtils.PromoCreditsAmount(booking, new[] { settings.Issued.Code, settings.Redeemed.Code });
                if (promoValue >= amountToRefund)
                {
                    isEligible = true;
                    breakdown = new CreditBreakdown { Promo = amountToRefund };
                }
            }
            else //credit or cash payments go to credit
            {
                var creditsAndCashValue = BookingUtils.CreditsAndCashAmount(booking);
                if (creditsAndCashValue >= amountToRefund)
                {
                    isEligible = true;
                    breakdown = new CreditBreakdown { Refund = amountToRefund };
                }
            }

            if (!isEligible)
            {
                return disabledByRules;
            }

            //only credit refund is allowed
            var eligibleForCreditRefund = new EligibleForRefund
            {
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Credit = RoundPriceToTwoDigits(amountToRefund),
                    CreditBreakdown = breakdown
                },
                Refund = new EligibleAction { IsEligible = false },
                Rules = RefundRules.PartialRefund,
                Status = RefundStatus.Ok
            };

            return eligibleForCreditRefund;
        }

        /// <inheritdoc />
        // BookingCanBeConvertedToCredit
        public async Task<CanBeRefunded> CanBeRefunded(BookingResponse booking, Data.Authentication.CustomerDetails customerDetails = null, bool isPartialRefund = false)
        {
            var eligibleSettings = _apiSettings.Vouchers.BookingIsEligibleForBeingCredited;
            var no = new CanBeRefunded { IsEnabled = false };
            var yes = new CanBeRefunded { IsEnabled = true };

            // Step 1. Validate if credits are enabled at all

            var bookingReference = booking?.BookingReference;
            if (!_apiSettings.Vouchers.IsActive)
            {
                _logger.LogInformation("Checking {BookingReference}. Vouchers disabled", bookingReference);
                return no;
            }

            if (!eligibleSettings.IsActive)
            {
                _logger.LogInformation("Checking {BookingReference}. Credit disabled", bookingReference);
                return no;
            }

            // Step 2. Do input data validation
            if (booking == null || booking.PaymentInfo == null)
            {
                _logger.LogInformation("Checking {BookingReference}. Booking or payment is null", bookingReference);
                return no;
            }
            // Booking should be in ACTIVE status
            if (!eligibleSettings.BookingStatuses.Contains(booking.BookingStatus))
            {
                _logger.LogInformation("Checking {BookingReference}. Booking is not active", bookingReference);
                return no;
            }

            var outboundRoute = booking?.Package?.Transport?.OutboundFlight;
            if (outboundRoute == null)
            {
                _logger.LogInformation("Checking {BookingReference}. No outbound route", bookingReference);
                return no;
            }

            // Validate customer Email only if it's not external Agency (these bookings don't have lead guest email)
            var customerEmail = customerDetails?.Email ?? await _authenticationService.GetCustomerEmail();
            var bookingEmail = booking?.CustomerDetails?.Email ?? string.Empty;
            if (!bookingEmail.Equals(customerEmail, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("Checking {BookingReference}. Booking and customer emails are different", bookingReference);
                return no;
            }

            // Booking is in the future
            var depDateWithTime = outboundRoute?.DepDate;
            if (depDateWithTime == null || depDateWithTime <= DateTime.UtcNow)
            {
                _logger.LogInformation("Checking {BookingReference}. Booking is not in future", bookingReference);
                return no;
            }
            var isPayedProperly = ValidateByPaymentType(booking, eligibleSettings);
            if (!isPayedProperly)
            {
                _logger.LogInformation("Checking {BookingReference}. Booking is not  properly(fully/partial/deposit rules)", bookingReference);
                return no;
            }

            //if it's partial refund (e.g. refund for amending/downgrading booking or call centre refund)
            //then we don't need to validate against CMS settings
            if (isPartialRefund)
            {
                return yes;
            }

            // Step 3. Validate against CMS settings
            var settings = await _settingsService.GetCancelCreditSettings();

            var exemptionList = (settings?.ExemptionList ?? new List<string>()).Select(x => x.Trim()).ToList(); // trim references to be 100% confident they are correct
            if (exemptionList.Contains(booking.BookingReference))
            {
                return yes;
            }

            var creditOnlyRules = settings?.CreditOnlyRules ?? new List<CreditOnlyRefundRule>();
            var eligibleCreditOnlyRules = FindEligibleRule(creditOnlyRules, booking);
            if (eligibleCreditOnlyRules != null && eligibleCreditOnlyRules.Any()) // collection is not empty 
            {
                return new CanBeRefunded
                {
                    Type = RefundType.CreditOnly,
                    IsEnabled = true
                };
            }

            return yes;
        }

        /// <inheritdoc />>
        public CreditBreakdown BuildCreditBreakdown(BookingResponse booking, RefundRules rule, EligibleAction action)
        {
            // No credits no breakdown
            if (action.Credit <= 0)
            {
                return new CreditBreakdown() { };
            }

            var depositPrice = BookingUtils.BookingDeposit(booking, _voucherSettings.DefaultDepositPerPerson);

            var totalCash = BookingUtils.TotalCash(booking);
            var giftCardsTotal = BookingUtils.GiftCardsAmount(booking);
            var promoCreditsTotal = BookingUtils.PromoCreditsAmount(booking);
            var realRefundCreditsTotal = BookingUtils.RefundCreditsAmount(booking);
            var otherCreditsTotal = action.Credit - giftCardsTotal - promoCreditsTotal; // it can be refund credits or refund+cash depending on action. But that's what we use as "refund credits" here

            var creditToProcess = action.Credit;
            var breakdown = new CreditBreakdown() { };
            if (rule == RefundRules.Regular)
            {
                if (action.Cash > 0 && (totalCash - action.Cash) > 0)
                {
                    // this is amount of cache which went to deposit and should be treated as "real refund" for credit part
                    // it shouldn't increase the value more than deposit amount
                    realRefundCreditsTotal += (totalCash - action.Cash);
                }
                /*
                 * Calculate refund values for promo vouchers, goodwill, refund, gift cards (it's the order we redeem them)
                 * Important: promo always ges first and is not included in goodwill
                 * e.g. Given payments received:
                 * - 10 promo_1
                 * - 10 promo_2
                 * - 50 Credit
                 * - 50 Gift card_1
                 * - 50 Gift card_2
                 * Then(deposit is 120) we should issue:
                 * - 10 promo_1
                 * - 10 promo_2
                 * - 120 Goodwill(50 credit+70 gift card)
                 * - 30 Gift card
                 *
                 * Also it's important that goodwill may be lower than deposit if it's paid by Promo
                 * e.g. 60 Promo + 60 cash -> 60 promo and 60 goodwill
                 */

                // first of all get rid of promo credits - they are processed separately
                creditToProcess -= promoCreditsTotal;
                var goodwillAmount = creditToProcess > depositPrice ? depositPrice : creditToProcess;
                breakdown = new CreditBreakdown()
                {
                    Promo = promoCreditsTotal,
                    Goodwill = goodwillAmount,
                    GiftCard = giftCardsTotal,
                    Refund = otherCreditsTotal
                };

                // and now we have to compensate goodwill
                // for goodwill we use priority: refund, gift card, cash
                var goodwillToProcess = goodwillAmount;

                decimal ReduceGoodwill(decimal from)
                {
                    var delta = from < goodwillToProcess ? from : goodwillToProcess;
                    goodwillToProcess -= delta;
                    return delta;
                }

                if (goodwillToProcess > 0)
                {
                    breakdown.Refund -= ReduceGoodwill(realRefundCreditsTotal);
                    //breakdown.Refund -= ReduceGoodwill(breakdown.Refund);
                }

                // we took all refund, lets consume giftcard
                if (goodwillToProcess > 0)
                {
                    breakdown.GiftCard -= ReduceGoodwill(breakdown.GiftCard);
                }

                if (goodwillToProcess > 0)
                {
                    breakdown.Refund -= ReduceGoodwill(breakdown.Refund);
                }

                // and finally make sure total balance is OK
                breakdown.Goodwill -= goodwillToProcess;
            }
            else
            {
                // We need to take credit from(by priority): cash, gift cards, credits, promo vouchers
                var availableCash = totalCash - action.Cash; // all paid cash minus cache we should refund 
                if (creditToProcess > 0 && availableCash > 0)
                {
                    // cash goes as refund credits
                    breakdown.Refund = availableCash > creditToProcess ? creditToProcess : availableCash;
                    creditToProcess -= breakdown.Refund;
                }

                if (creditToProcess > 0 && giftCardsTotal > 0)
                {
                    breakdown.GiftCard = giftCardsTotal > creditToProcess ? creditToProcess : giftCardsTotal;
                    creditToProcess -= breakdown.GiftCard;
                }

                if (creditToProcess > 0 && otherCreditsTotal > 0)
                {
                    // refund credits
                    var regularCreditsToUse = otherCreditsTotal > creditToProcess ? creditToProcess : otherCreditsTotal;
                    breakdown.Refund += regularCreditsToUse; // yes, here we add to refund card, because it's "default" credit type
                    creditToProcess -= regularCreditsToUse;
                }

                if (creditToProcess > 0 && promoCreditsTotal > 0)
                {
                    breakdown.Promo = promoCreditsTotal > creditToProcess ? creditToProcess : promoCreditsTotal;
                }
            }

            _logger.LogInformation("Credit breakdown. Promo: {Promo}, goodwill: {Goodwill}, giftcard: {Giftcard}, refund: {Refund}", breakdown.Promo, breakdown.Goodwill, breakdown.GiftCard, breakdown.Refund);

            return breakdown;
        }

        public CreditBreakdown BuildPartialRefundCreditBreakdown(BookingResponse booking, RefundRules rule, EligibleAction action)
        {
            // No credits no breakdown
            if (action.Credit <= 0)
            {
                return new CreditBreakdown() { };
            }

            var giftCardsTotalAmount = BookingUtils.GiftCardsAmount(booking);
            var promoCreditsTotalAmount = BookingUtils.PromoCreditsAmount(booking);

            // Now we should colculate, what type and how many we should return.
            // Order: promotion, giftcard, othr credit

            decimal promotionCreditToRefund = 0;
            decimal giftCreditToRefund = 0;
            decimal creditToRefund = action.Credit;

            if (creditToRefund > 0)
            {
                promotionCreditToRefund =
                    creditToRefund > promoCreditsTotalAmount ? promoCreditsTotalAmount : creditToRefund;

                creditToRefund -= promotionCreditToRefund;
            }

            if (creditToRefund > 0)
            {
                giftCreditToRefund = creditToRefund > giftCardsTotalAmount ? giftCardsTotalAmount : creditToRefund;

                creditToRefund -= giftCreditToRefund;
            }

            var breakdown = new CreditBreakdown()
            {
                Promo = promotionCreditToRefund,
                GiftCard = giftCreditToRefund,
                Refund = creditToRefund
            };


            return breakdown;
        }

        private async Task<EligibleForRefund> BuildEligibleForRefund(BookingResponse booking, Data.Authentication.CustomerDetails customerDetails = null)
        {
            var disabledByRules = new EligibleForRefund
            {
                Credit = new EligibleAction { IsEligible = false },
                Refund = new EligibleAction { IsEligible = false },
                Status = RefundStatus.DisabledByRules,
                Rules = RefundRules.NoRefund
            };

            var refundAvailable = await CanBeRefunded(booking, customerDetails);
            if (!refundAvailable.IsEnabled)
            {
                _logger.LogInformation("Refund disabled by rules");
                return disabledByRules;
            }
            
            var daysBeforeDeparture = BookingUtils.DaysToDeparture(booking);

            var refundSettings = _apiSettings.Vouchers.BookingIsEligibleForBeingCredited;
            var settings = await _settingsService.GetCancelCreditSettings();

            var refundDaysSettings = refundSettings.RefundDays;
            _logger.LogInformation("Days before departure: {DaysBeforeDeparture}, booking date: {BookingDate}, settings: {AllowPartialRefunds}, " +
                "{SpecialRulesIfLessThan}, {CreditOnlyIfLessThan}, {DisabledIfLessThan}, {CurrentRulesApplyFrom}, {CurrentDays}, {PreviousDays}",
                daysBeforeDeparture, booking.BookingDate, refundSettings.AllowPartialRefunds, refundDaysSettings.SpecialRulesIfLessThan,
                refundDaysSettings.CreditOnlyIfLessThan, refundDaysSettings.DisabledIfLessThan, settings.CurrentRulesApplyForHolidaysBookedFrom,
                settings.CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture, settings.PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture);

            var allowRefundsForXOrMoreDaysBeforeDeparture = booking.BookingDate >= settings.CurrentRulesApplyForHolidaysBookedFrom
                ? settings.CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture : settings.PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture;
            
            if (daysBeforeDeparture >= allowRefundsForXOrMoreDaysBeforeDeparture)
            {
                return GetStandardRefund(booking);
            }

            // per country/per airport cancellation & refund rules from sitecore
            if (refundAvailable.Type == RefundType.CreditOnly)
            {
                // refund is enabled, but only credits
                var creditsOnlyRefund = GetStandardRefund(booking);
                creditsOnlyRefund.Rules = RefundRules.CreditOnly;
                creditsOnlyRefund.Refund = new EligibleAction { IsEligible = false };
                return creditsOnlyRefund;
            }

            // special partial refunds. currently disabled on prod and most other environments
            if (refundSettings.AllowPartialRefunds && daysBeforeDeparture < refundSettings.RefundDays.SpecialRulesIfLessThan)
            {
                var fullyPaid = booking.PaymentInfo.BalanceDueAmount <= 0;
                if (!fullyPaid)
                {
                    _logger.LogInformation("Less than {SpecialRulesIfLessThan} days, not fully paid, use standard rules", refundSettings.RefundDays.SpecialRulesIfLessThan);
                    return GetStandardRefund(booking);
                }

                return GetSpecialPartialRefund(booking, refundSettings, daysBeforeDeparture);
            }

            return disabledByRules;
        }

        private EligibleForRefund GetStandardRefund(BookingResponse booking)
        {
            var total = BookingUtils.BookingValue(booking);
            var deposit = BookingUtils.BookingDeposit(booking, _voucherSettings.DefaultDepositPerPerson);
            var cashInDeposit = BookingUtils.CashAmountInDeposit(booking, deposit);
            var totalCash = BookingUtils.TotalCash(total, booking);

            // Default credit&refund rules
            // Option 1. Get 100% credit
            // Option 2. Refund & credit:
            // - Deposit returned as credit
            // - Credits returned as credit
            // - Balance returned as cash (not including deposit)
            var standardCashRefund = Math.Max(totalCash - cashInDeposit, decimal.Zero);

            return new EligibleForRefund
            {
                // Build option #1: credit only
                Credit = new EligibleAction
                {
                    IsEligible = total > 0,
                    Credit = total
                },
                // Build option #2: cash and credit
                Refund = new EligibleAction
                {
                    IsEligible = standardCashRefund > 0,
                    Cash = standardCashRefund,
                    Credit = standardCashRefund > 0 ? (total - standardCashRefund) : 0
                }
            };
        }

        /// <summary>
        /// Special partial refund rules: when departure within 28 days & refund is available
        /// </summary>
        /// <returns></returns>
        private EligibleForRefund GetSpecialPartialRefund(BookingResponse booking, BookingIsEligibleForBeingCreditedSettings refundSettings, double daysBeforeDeparture)
        {
            if (!refundSettings.AllowPartialRefunds)
            {
                throw new ArgumentException("Special partial refunds are disabled");
            }

            var refundDaysSettings = refundSettings.RefundDays;
            // Special rules when less than 28 days until departure(don't refund 100)
            // 27-21 days: 
            //      - 50% credit OR 25% cash(remainder of 25% topped with credit)
            //      - 50% credit
            // 14-20: 25% Credit
            // 13-0: nothing
            if (daysBeforeDeparture < refundDaysSettings.DisabledIfLessThan)
            {
                _logger.LogInformation("Refund disabled: 0-13 days");
                // 0-13 days
                return new EligibleForRefund
                {
                    Credit = new EligibleAction(),
                    Refund = new EligibleAction(),
                    Status = RefundStatus.DisabledOnSite,
                    Rules = RefundRules.NoRefund
                };
            }
            else if (daysBeforeDeparture < refundDaysSettings.CreditOnlyIfLessThan)
            {
                var total = BookingUtils.BookingValue(booking);
                // 14-20 days
                return new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = total > 0,
                        Credit = total > 0 ? (total * 0.25m) : 0
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = false
                    },
                    Rules = RefundRules.CreditOnly
                };
            }
            else if (daysBeforeDeparture < refundDaysSettings.SpecialRulesIfLessThan)
            {
                var total = BookingUtils.BookingValue(booking);
                var totalCash = BookingUtils.TotalCash(booking);
                var maxRefund = total * 0.25m;
                var cashRefund = totalCash > maxRefund ? maxRefund : totalCash;

                // 21-27 days
                return new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = total > 0,
                        Credit = total > 0 ? (total * 0.5m) : 0
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = cashRefund > 0,
                        Cash = cashRefund,
                        Credit = cashRefund > 0 ? (maxRefund - cashRefund) : 0
                    },
                    Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                };
            }
            else
            {
                throw new ArgumentException($"Special refunds are not allowed with current settings. Days before departure: {daysBeforeDeparture}. " +
                    $"Refunds allowed for less than {refundDaysSettings.SpecialRulesIfLessThan} days");
            }
        }

        /// <summary>
        /// Find rules which applicable for specified booking.
        /// If there are not valid rules method returns <code>empty collection</code>.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="rules"></param>
        /// <param name="booking"></param>
        /// <returns>Valid and applicable rules</returns>
        private IEnumerable<T> FindEligibleRule<T>(IEnumerable<T> rules, BookingResponse booking)
            where T : CreditAndCashRefundBaseRule
        {
            if (rules == null || !rules.Any())
            {
                return Enumerable.Empty<T>();
            }

            var nowDate = DateTime.UtcNow;
            var bookingReference = booking.BookingReference;
            var outboundRoute = booking?.Package?.Transport?.OutboundFlight; // don't validate it here, should be validated in parent method

            // Filter rules by airport and activation dates
            rules = rules.Where(rule =>
            {
                var airports = rule.DestinationAirports ?? new List<string>();
                var start = rule.Active?.Start;
                var end = rule.Active?.End;

                var arrivalAirport = outboundRoute.ArrPt;
                if (!(airports.Contains(arrivalAirport) || airports.Count() == 0))
                {  // target airport in the list or the list is empty
                    _logger.LogInformation("Checking {BookingReference}. Arrival airport is not in the list", bookingReference);
                    return false;
                }

                if (!(start == null || start?.Date <= nowDate) && (end == null || end?.Date >= nowDate))
                {
                    _logger.LogInformation("Checking {BookingReference}. Active dates are not valid", bookingReference);
                    return false;
                }

                var bookingDepartureDate = new DateRangeSettings
                {
                    From = rule.BookingDepartureDateFrom ?? DateTimeOffset.MinValue,
                    To = rule.BookingDepartureDateTo ?? DateTimeOffset.MaxValue
                };

                var bookedWithinDate = new DateRangeSettings
                {
                    From = rule.BookedWithinDateFrom ?? DateTimeOffset.MinValue,
                    To = rule.BookedWithinDateTo ?? DateTimeOffset.MaxValue
                };

                var dateOfChange = new DateRangeSettings
                {
                    From = rule.DateOfChangeFrom ?? DateTimeOffset.MinValue,
                    To = rule.DateOfChangeTo ?? DateTimeOffset.MaxValue
                };

                // Booking departure date is between configured dates (so we can control which bookings can be converted)
                var depDate = outboundRoute?.DepDate?.Date;
                if (depDate < bookingDepartureDate.From.Date || depDate > bookingDepartureDate.To.Date)
                {
                    _logger.LogInformation("Checking {BookingReference}. Booking departure date is not between configured dates", bookingReference);
                    return false;
                }

                // Date of the change is between configured dates(so we can turn the functionality off in the future)
                if (nowDate < dateOfChange.From.Date || nowDate > dateOfChange.To.Date)
                {
                    _logger.LogInformation("Checking {BookingReference}. Date of change is not between configured dates", bookingReference);
                    return false;
                }

                var bookingDate = booking?.BookingDate.Date;
                if (bookingDate < bookedWithinDate.From.Date || bookingDate > bookedWithinDate.To.Date)
                {
                    _logger.LogInformation("Checking {BookingReference}. Booking date is not between configured booked within dates", bookingReference);
                    return false;
                }

                var oddDaysBeforeDeparture = (outboundRoute?.DepDate - nowDate).Value.Days;

                // Booking departure date is >= X days from date of change (so the booking can’t be changed if it departs in less than the configured days)
                if (oddDaysBeforeDeparture < rule.DaysBeforeDeparture)
                {
                    _logger.LogInformation("Checking {BookingReference}. Booking departure date is less than {DaysBeforeDeparture} days", bookingReference, rule.DaysBeforeDeparture);
                    return false;
                }

                return true;
            });

            return rules;
        }

        /// <summary>
        /// Validates:
        ///     - AllowDepositOnlyToBeConverted
        ///     - AllowPartiallyPaidToBeConverted 
        ///     - AllowFullyPaidToBeConverted 
        /// </summary>
        /// <param name="settings"></param>
        /// <returns></returns>
        private bool ValidateByPaymentType(BookingResponse booking, BaseBookingIsEligibleForBeingCreditedSettings settings)
        {
            // Allow fully paid bookings to be converted
            var dueAmount = booking.PaymentInfo.BalanceDueAmount;
            var fullyPaid = dueAmount <= 0;
            if (!settings.AllowFullyPaidToBeConverted && fullyPaid)
            {
                _logger.LogInformation("Checking {BookingReference}. Fully paid booking is not allowed", booking.BookingReference);
                return false;
            }

            // Allow deposit only bookings to be converted 
            var depositOnlyPaid = booking.PaymentInfo.DepositPrice == (booking.PaymentInfo.TotalPrice - dueAmount);
            if (!settings.AllowDepositOnlyToBeConverted && depositOnlyPaid)
            {
                _logger.LogInformation("Checking {BookingReference}. Deposit only booking is not allowed", booking.BookingReference);
                return false;
            }

            // Allow partially paid bookings to be converted
            var partiallyPaid = !depositOnlyPaid && (dueAmount > 0 && dueAmount < booking.PaymentInfo.TotalPrice); // deposit bookings are not treated as partially paid
            if (!settings.AllowPartiallyPaidToBeConverted && partiallyPaid)
            {
                _logger.LogInformation("Checking {BookingReference}. Partially paid booking is not allowed", booking.BookingReference);
                return false;
            }

            return true;
        }

        private async Task<EligibleForRefund> BuildEligibleForPartialRefund(BookingResponse booking,
            decimal amountToRefund, Data.Authentication.CustomerDetails customerDetails = null)
        {
            var disabledByRules = new EligibleForRefund
            {
                Credit = new EligibleAction { IsEligible = false },
                Refund = new EligibleAction { IsEligible = false },
                Status = RefundStatus.DisabledByRules
            };

            var refundAvailable = await CanBeRefunded(booking, customerDetails, true);

            if (!refundAvailable.IsEnabled)
            {
                _logger.LogInformation("Refund disabled by rules");
                return disabledByRules;
            }

            var total = BookingUtils.BookingValue(booking);
            var totalCredits = BookingUtils.CreditAmount(booking);
            var totalCash = BookingUtils.TotalCash(booking);

            var amountToRefundAsCreditIfCashIsInsufficient =
                amountToRefund - totalCash; //if the total amount of cash in the booking is insufficient for a refund

            // Partial credit&refund rules
            // Option 1. Get 100% credit
            // Option 2. Get 100% as cash (if totalCash >= amountToRefund)
            // Option 3. Refund & credit (if totalCash <= amountToRefund):
            //          - cash returned as cash
            //          - remaining amountToRefund (amountToRefund - cash) returned as credit
            //Note: if dueAmount >= amountToRefund, dueAmount will be reduced by amountToRefund value at the top level
            var eligibleForRefund = new EligibleForRefund
            {
                // Build option #1: credit only
                Credit = new EligibleAction { IsEligible = total >= amountToRefund, Credit = amountToRefund },
                // Build options #2 and #3: cash or cash and credit
                Refund = new EligibleAction
                {
                    IsEligible = total >= amountToRefund && totalCash > 0,
                    Cash = totalCash >= amountToRefund ? amountToRefund : totalCash,
                    Credit = totalCash >= amountToRefund
                        ? 0 //cash is enough to refund
                        : (totalCredits >= amountToRefundAsCreditIfCashIsInsufficient)
                            ? amountToRefundAsCreditIfCashIsInsufficient
                            : totalCredits
                },
                Rules = RefundRules.PartialRefund
            };

            return eligibleForRefund;
        }

        private static void RoundPriceToTwoDigits(EligibleForRefund model)
        {
            model.Credit.Credit = RoundPriceToTwoDigits(model.Credit.Credit);
            model.Credit.Cash = RoundPriceToTwoDigits(model.Credit.Cash);

            model.Refund.Credit = RoundPriceToTwoDigits(model.Refund.Credit);
            model.Refund.Cash = RoundPriceToTwoDigits(model.Refund.Cash);
        }

        private static decimal RoundPriceToTwoDigits(decimal amount)
        {
            return Math.Ceiling(amount * 100) / 100;
        }
    }
}