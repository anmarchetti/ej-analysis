using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using IAuthenticationService = easyJet.Holidays.Api.Domain.Services.Authentication.IAuthenticationService;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation
{
    /// <inheritdoc />
    public class BookingCancellationRefundValidationService : IBookingCancellationRefundValidationService
    {
        private readonly ApiSettings _apiSettings;
        private readonly ILogger<BookingCancellationRefundValidationService> _logger;
        private readonly IAuthenticationService _authenticationService;
        private readonly ISettingsService _settingsService;
        private readonly IReferenceDataService _referenceDataService;

        /// <summary>
        /// Constructor
        /// </summary>
        public BookingCancellationRefundValidationService(IOptions<ApiSettings> apiSettings, IAuthenticationService authenticationService, ISettingsService settingsService, IReferenceDataService referenceDataService, ILogger<BookingCancellationRefundValidationService> logger)
        {
            _apiSettings = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _authenticationService = authenticationService;
            _settingsService = settingsService;
            _referenceDataService = referenceDataService;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<bool> IsRefundEnabled(BookingResponse bookingResponse, bool isSharedServiceCall, BookingCancellationReason bookingCancellationReason)
        {
            // Step 1. Validate if credits are enabled at all
            var bookingReference = bookingResponse?.BookingReference;
            if (!_apiSettings.Vouchers.IsActive)
            {
                _logger.LogInformation("Checking {BookingReference}. Vouchers disabled", bookingReference);
                return false;
            }

            var eligibleSettings = _apiSettings.Vouchers.BookingIsEligibleForBeingCredited;
            if (!eligibleSettings.IsActive)
            {
                _logger.LogInformation("Checking {BookingReference}. Credit disabled", bookingReference);
                return false;
            }

            if (bookingResponse == null || bookingResponse.PaymentInfo == null)
            {
                _logger.LogInformation("Checking {BookingReference}. Booking or payment is null", bookingReference);
                return false;
            }
            // Booking should be in ACTIVE status
            if (!IsBookingActive(bookingResponse, eligibleSettings, isSharedServiceCall, bookingCancellationReason))
            {
                _logger.LogInformation("Checking {BookingReference}. Booking is not active", bookingReference);
                return false;
            }

            if (!CheckBookingRoutes(bookingResponse, isSharedServiceCall, bookingCancellationReason))
            {
                return false;
            }
            
            var isPayedProperly = ValidateByPaymentType(bookingResponse, eligibleSettings);
            if (!isPayedProperly)
            {
                _logger.LogInformation("Checking {BookingReference}. Booking is not  properly(fully/partial/deposit rules)", bookingReference);
                return false;
            }
            
            // Step 3. Validate against CMS settings
            var settings = await _settingsService.GetCancelCreditSettings();
            if (!(settings?.EnableOneTimeUseCredit ?? false))
            {
                _logger.LogInformation("Checking {BookingReference}. OneTimeUseCredit is not enabled!", bookingReference);
                return false;
            }

            if (CheckCancellationRestrictionHours(isSharedServiceCall, bookingCancellationReason) && await IsInsideCancellationRestrictionHouse(bookingResponse))
            {
                _logger.LogInformation("Checking {BookingReference}. Booking was created inside the cancellationRestrictionHours!. Booking was created: {BookingCreationDate}", bookingReference, bookingResponse.BookingDate.ToString("F", CultureInfo.InvariantCulture));
                return false;
            }
            
            var exemptionList = (settings.ExemptionList ?? new List<string>()).Select(x => x.Trim()).ToList(); // trim references to be 100% confident they are correct
            return !exemptionList.Contains(bookingResponse.BookingReference);
        }

        private static bool IsBookingActive(BookingResponse bookingResponse, BookingIsEligibleForBeingCreditedSettings eligibleSettings, bool isSharedServiceCall, BookingCancellationReason bookingCancellationReason)
        {
            if (isSharedServiceCall && bookingCancellationReason == BookingCancellationReason.EasyJetLed)
            {
                return true;
            }

            return eligibleSettings.BookingStatuses.Contains(bookingResponse.BookingStatus);
        }

        private static bool CheckCancellationRestrictionHours(bool isSharedServiceCall, BookingCancellationReason bookingCancellationReason)
        {
            return !isSharedServiceCall && 
                   bookingCancellationReason is BookingCancellationReason.CustomerLed or BookingCancellationReason.TradeLed;
        }

        private async Task<bool> IsInsideCancellationRestrictionHouse(BookingResponse bookingResponse)
        {
            var amendBookingSetting = await _referenceDataService.GetAmendBookingSetting();
            if (amendBookingSetting is not { CancellationRestrictionHours: not null })
            {
                return false;
            }

            var cancellationRestrictionHours = bookingResponse.BookingDate.AddHours(amendBookingSetting.CancellationRestrictionHours ?? 0);
            return cancellationRestrictionHours > DateTime.UtcNow;
        }

        /// <inheritdoc />
        public async Task<bool> IsCurrentUserLeadPassenger(BookingResponse bookingResponse)
        {
            // Validate customer Email only if it's not external Agency (these bookings don't have lead guest email)
            var customerEmail = await _authenticationService.GetCustomerEmail();
            var bookingEmail = bookingResponse?.CustomerDetails?.Email ?? string.Empty;
            if (!bookingEmail.Equals(customerEmail, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("Checking {BookingReference}. Booking and customer emails are different", bookingResponse?.BookingReference);
                return false;
            }

            return true;
        }

        private bool CheckBookingRoutes(BookingResponse bookingResponse, bool isSharedServiceCall, BookingCancellationReason bookingCancellationReason)
        {
            var outboundRoute = bookingResponse.Package?.Transport?.OutboundFlight;
            if (outboundRoute == null)
            {
                _logger.LogInformation("Checking {BookingReference}. No outbound route", bookingResponse.BookingReference);
                return false;
            }

            if (isSharedServiceCall && bookingCancellationReason == BookingCancellationReason.EasyJetLed)
            {
                _logger.LogInformation("Checking {BookingReference}. IsSharedServiceCall = true. Skip booking is in the future check.", bookingResponse.BookingReference);
                return true;
            }

            // Booking is in the future
            var depDateWithTime = outboundRoute.DepDate;
            if (depDateWithTime == null || depDateWithTime <= DateTime.UtcNow)
            {
                _logger.LogInformation("Checking {BookingReference}. Booking is not in future", bookingResponse.BookingReference);
                return false;
            }

            return true;
        }

        /// <summary>
        /// Validates:
        ///     - AllowDepositOnlyToBeConverted
        ///     - AllowPartiallyPaidToBeConverted 
        ///     - AllowFullyPaidToBeConverted 
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="settings"></param>
        /// <returns></returns>
        private bool ValidateByPaymentType(BookingResponse bookingResponse, BaseBookingIsEligibleForBeingCreditedSettings settings)
        {
            // Allow fully paid bookings to be converted
            var dueAmount = bookingResponse.PaymentInfo.BalanceDueAmount;
            var fullyPaid = dueAmount <= 0;
            if (!settings.AllowFullyPaidToBeConverted && fullyPaid)
            {
                _logger.LogInformation("Checking {BookingReference}. Fully paid booking is not allowed", bookingResponse.BookingReference);
                return false;
            }

            // Allow deposit only bookings to be converted 
            var depositOnlyPaid = bookingResponse.PaymentInfo.DepositPrice == (bookingResponse.PaymentInfo.TotalPrice - dueAmount);
            if (!settings.AllowDepositOnlyToBeConverted && depositOnlyPaid)
            {
                _logger.LogInformation("Checking {BookingReference}. Deposit only booking is not allowed", bookingResponse.BookingReference);
                return false;
            }

            // Allow partially paid bookings to be converted
            var partiallyPaid = !depositOnlyPaid && (dueAmount > 0 && dueAmount < bookingResponse.PaymentInfo.TotalPrice); // deposit bookings are not treated as partially paid
            if (!settings.AllowPartiallyPaidToBeConverted && partiallyPaid)
            {
                _logger.LogInformation("Checking {BookingReference}. Partially paid booking is not allowed", bookingResponse.BookingReference);
                return false;
            }

            return true;
        }
    }
}