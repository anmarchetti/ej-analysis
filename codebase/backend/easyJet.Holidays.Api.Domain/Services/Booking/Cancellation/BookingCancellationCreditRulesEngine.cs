using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation
{
    /// <inheritdoc />
    public class BookingCancellationCreditRulesEngine : IBookingCancellationCreditRulesEngine
    {
        private readonly ISettingsService _settingsService;
        private readonly ILogger<BookingCancellationCreditRulesEngine> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="settingsService"></param>
        /// <param name="logger"></param>
        public BookingCancellationCreditRulesEngine(ISettingsService settingsService, ILogger<BookingCancellationCreditRulesEngine> logger)
        {
            _settingsService = settingsService;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<List<CreditOnlyRefundRule>> FindEligibleRule(BookingResponse bookingResponse)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);

            var bookingReference = bookingResponse.BookingReference;
            var settings = await _settingsService.GetCancelCreditSettings();
            var rules = settings?.CreditOnlyRules?.ToList() ?? [];
            if (rules.Count == 0)
            {
                _logger.LogInformation("No rules found for {BookingReference}", bookingReference);
                return [];
            }

            var nowDate = DateTime.UtcNow;
            var bookingDate = bookingResponse.BookingDate.Date;
            var outboundRoute = bookingResponse.Package?.Transport?.OutboundFlight;

            if(outboundRoute == null)
            {
                _logger.LogInformation("Outbound route is null for {BookingReference}", bookingReference);
                return [];
            }

            if (outboundRoute.DepDate == null)
            {
                _logger.LogInformation("Departure date is null for {BookingReference}", bookingReference);
                return [];
            }

            // Filter rules by airport and activation dates
            return rules.Where(rule => HasMatchingRule(rule, outboundRoute, bookingReference, nowDate, bookingDate)).ToList();
        }

        private bool HasMatchingRule(CreditOnlyRefundRule rule, Route outboundRoute, string bookingReference, DateTime nowDate, DateTime bookingDate)
        {
            ArgumentNullException.ThrowIfNull(outboundRoute);
            ArgumentNullException.ThrowIfNull(outboundRoute.DepDate);

            var airports = rule.DestinationAirports?.ToList() ?? [];
            var start = rule.Active?.Start;
            var end = rule.Active?.End;
            var arrivalAirport = outboundRoute.ArrPt;

            if (airports.Count == 0)
            {
                _logger.LogInformation("Checking {BookingReference}. No destination airports configured", bookingReference);
                return false;
            }
                
            if (NoMatchingAirport(airports, arrivalAirport))
            {
                _logger.LogInformation("Checking {BookingReference}. Arrival airport is not in the list", bookingReference);
                return false;
            }

            bool startInFuture = start != null && start.Value.Date > nowDate;
            bool endInFutureOrNull = end == null || end.Value.Date <= nowDate;

            if (startInFuture || endInFutureOrNull)
            {
                _logger.LogInformation("Checking {BookingReference}. Active dates are not valid", bookingReference);
                return false;
            }

            DateRangeSettings bookingDepartureDate = GetBookingDepartureDate(rule);
            DateRangeSettings bookedWithinDate = GetBookedWithinDate(rule);
            DateRangeSettings dateOfChange = GetDateRangeSettings(rule);

            var depDate = outboundRoute.DepDate.Value.Date;
            if (IsOutsideDepartureDates(depDate, bookingDepartureDate))
            {
                _logger.LogInformation("Checking {BookingReference}. Booking departure date is not between configured dates", bookingReference);
                return false;
            }

            if (IsOutsideConfiguredDate(nowDate, dateOfChange))
            {
                _logger.LogInformation("Checking {BookingReference}. Date of change is not between configured dates", bookingReference);
                return false;
            }

            if (IsOutsideConfiguredDate(bookingDate, bookedWithinDate))
            {
                _logger.LogInformation("Checking {BookingReference}. Booking date is not between configured booked within dates", bookingReference);
                return false;
            }

            var oddDaysBeforeDeparture = (outboundRoute.DepDate - nowDate).Value.Days;
            if (IsInsideDaysBeforeDeparture(oddDaysBeforeDeparture, rule))
            {
                _logger.LogInformation("Checking {BookingReference}. Booking departure date is less than {DaysBeforeDeparture} days", bookingReference, rule.DaysBeforeDeparture);
                return false;
            }

            return true;
        }

        private static bool NoMatchingAirport(List<string> airports, string arrivalAirport)
        {
            return !airports.Contains(arrivalAirport);
        }

        private static bool IsInsideDaysBeforeDeparture(int oddDaysBeforeDeparture, CreditOnlyRefundRule rule)
        {
            return oddDaysBeforeDeparture < rule.DaysBeforeDeparture;
        }

        private static DateRangeSettings GetDateRangeSettings(CreditOnlyRefundRule rule)
        {
            var dateOfChange = new DateRangeSettings
            {
                From = rule.DateOfChangeFrom ?? DateTimeOffset.MinValue,
                To = rule.DateOfChangeTo ?? DateTimeOffset.MaxValue
            };
            return dateOfChange;
        }

        private static DateRangeSettings GetBookingDepartureDate(CreditOnlyRefundRule rule)
        {
            var bookingDepartureDate = new DateRangeSettings
            {
                From = rule.BookingDepartureDateFrom ?? DateTimeOffset.MinValue,
                To = rule.BookingDepartureDateTo ?? DateTimeOffset.MaxValue
            };
            return bookingDepartureDate;
        }

        private static DateRangeSettings GetBookedWithinDate(CreditOnlyRefundRule rule)
        {
            var bookedWithinDate = new DateRangeSettings
            {
                From = rule.BookedWithinDateFrom ?? DateTimeOffset.MinValue,
                To = rule.BookedWithinDateTo ?? DateTimeOffset.MaxValue
            };
            return bookedWithinDate;
        }

        private static bool IsOutsideDepartureDates(DateTime depDate, DateRangeSettings bookingDepartureDate)
        {
            return depDate < bookingDepartureDate.From.Date || depDate > bookingDepartureDate.To.Date;
        }

        private static bool IsOutsideConfiguredDate(DateTime nowDate, DateRangeSettings dateOfChange)
        {
            return nowDate < dateOfChange.From.Date || nowDate > dateOfChange.To.Date;
        }
    }
}
