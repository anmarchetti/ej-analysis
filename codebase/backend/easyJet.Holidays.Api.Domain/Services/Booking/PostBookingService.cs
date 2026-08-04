using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    public class PostBookingService : IPostBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IBookingConfirmationService _confirmationService;
        private readonly IVatInvoiceService _vatInvoiceService;
        private readonly IAuthenticationService _authenticationService;
        private readonly ILogger<PostBookingService> _logger;
        private readonly IBookingFetchService _bookingService;
        private readonly IContentService _contentService;
        private readonly IErrataInfoService _errataInfoService;
        private readonly ILanguageService _languageService;
        private readonly IReferenceDataService _referenceDataService;

        public PostBookingService(
            IAuthenticationService authenticationService,
            IBookingConfirmationService confirmationService,
            IVatInvoiceService vatInvoiceService,
            ILogger<PostBookingService> logger,
            IBookingRepository bookingRepository,
            IBookingFetchService bookingService,
            IContentService contentService,
            IErrataInfoService errataInfoService,
            ILanguageService languageService,
            IReferenceDataService referenceDataService
            )
        {
            _bookingRepository = bookingRepository;
            _authenticationService = authenticationService;
            _logger = logger;
            _confirmationService = confirmationService;
            _vatInvoiceService = vatInvoiceService;
            _bookingService = bookingService;
            _contentService = contentService;
            _errataInfoService = errataInfoService;
            _languageService = languageService;
            _referenceDataService = referenceDataService;
        }

        /// <inheritdoc />
        public async Task<Stream> Confirmation(GetBookingRequest request)
        {
            // We do it to validate booking information, but we don't need response
            var booking = await _bookingRepository.GetBooking(request);
            var memos = await _bookingRepository.GetBookingMemo(booking.BookingReference);
            booking.IsPrivate = _bookingService.BookingIsPrivate(memos);
            await _bookingService.ValidateByBookingPrivacy(booking);

            return await _confirmationService.GetBookingConfirmation(request.BookingReference);
        }

        /// <inheritdoc />
        public async Task<Stream> PaymentReceipt(GetBookingRequest request)
        {
            // Validate booking information the same way as Confirmation – do not expose
            // whether reference, lastName or date are invalid to the caller.
            var booking = await _bookingRepository.GetBooking(request);
            var memos = await _bookingRepository.GetBookingMemo(booking.BookingReference);
            booking.IsPrivate = _bookingService.BookingIsPrivate(memos);
            await _bookingService.ValidateByBookingPrivacy(booking);

            return await _vatInvoiceService.GetVatInvoicePdf(request.BookingReference);
        }

        /// <inheritdoc />
        public async Task<IEnumerable<BookingResponse>> MyBookings()
        {
            var customer = await _authenticationService.CustomerDetails();
            var customerId = await _authenticationService.MappedCustomerId(customer);

            if (string.IsNullOrEmpty(customerId))
            {
                throw new ApiException(ApiExceptionCodes.CustomerNoMappedId, null, "Can not get customer id");
            }

            // Get bookings, but they are done in unsafe manner
            var bookings = await _bookingRepository.SearchBookings(customerId, false);
            var privacyFilterBookings = new List<BookingResponse>();
            var language = _languageService.GetCurrentLanguage();
            var excludedPromotionCodes = await GetExcludedPromotionCodes();
            var skippedBookingsWithPromotionCodes = new List<string>();

            foreach (var booking in bookings)
            {
                try
                {
                    if (booking.PromotionCollections?.Any(promotionCode => excludedPromotionCodes.Contains(promotionCode)) ?? false)
                    {
                        skippedBookingsWithPromotionCodes.Add(booking.BookingReference);
                        continue;
                    }

                    await _bookingService.EnrichAndSecureBookingResponse(booking);
                    var bookingEmail = booking?.CustomerDetails?.Email ?? string.Empty;
                    if (booking?.IsPrivate != true || bookingEmail.Equals(customer?.Email, StringComparison.OrdinalIgnoreCase))
                    {
                        privacyFilterBookings.Add(booking);
                    }
                    await _errataInfoService.EnrichWithFlightErrataInfo(booking, language);
                }
                catch (ApiException ex)
                {
                    if (ex.Code.Code == ApiExceptionCodes.BookingFraudError.Code)
                    {
                        _logger.LogInformation("Skipping fraud booking {BookingReference}", booking?.BookingReference);
                    }
                    else
                    {
                        _logger.LogInformation("Skipping booking because of unexpected error: {BookingReference}", booking?.BookingReference);
                    }
                }
            }

            if (skippedBookingsWithPromotionCodes.Count > 0)
            {
                _logger.LogInformation(
                    "Skipping bookings with promotion code. Booking references: {BookingReferences}",
                    string.Join(", ", skippedBookingsWithPromotionCodes));
            }

            if (!privacyFilterBookings.Any())
            {
                return privacyFilterBookings;
            }

            await _contentService.UpdateHealsEntryRequirementsContent(privacyFilterBookings);

            return privacyFilterBookings;
        }

        private async Task<HashSet<string>> GetExcludedPromotionCodes()
        {
            var settings = await _referenceDataService.GetMyBookingsSettings();
            return settings?.HideBookingsWithPromotion?.Select(i => i.Key).ToHashSet() ?? [];
        }

        /// <inheritdoc />
        public async Task Assign(AssignBookingRequest request)
        {
            var customerId = await _authenticationService.MappedCustomerId();
            if (string.IsNullOrEmpty(customerId))
            {
                throw new ApiException(ApiExceptionCodes.CustomerNoMappedId, null, "Can not get customer id");
            }

            var booking = await _bookingRepository.GetBooking(request);
            if (booking.CustomerId == customerId)
            {
                // In case when I try to add a booking already added into account
                throw new ApiException(ApiExceptionCodes.BookingAssignAlreadyAssignedToAccount, null, "Booking is already assigned to your account");
            }

            if (!string.IsNullOrEmpty(booking.CustomerId))
            {
                // In case booking is added to other account
                throw new ApiException(ApiExceptionCodes.BookingAssignAlreadyAssigned, null, "Booking is already assigned");
            }

            if (!booking.IsExternalAgency)
            {
                // Validate customer Email only f it's not external Agency (these bookings don't have lead guest email)
                var customerEmail = await _authenticationService.GetCustomerEmail();
                var bookingEmail = booking.CustomerDetails?.Email ?? string.Empty;
                if (!bookingEmail.Equals(customerEmail, StringComparison.OrdinalIgnoreCase))
                {
                    // shouldn't be possible to associate a booking with email different from the one in account
                    throw new ApiException(ApiExceptionCodes.BookingAssignInvalidEmail, null, "Can not assign booking with email different from customer email");
                }
            }

            var excludedPromotionCodes = await GetExcludedPromotionCodes();
            if (booking.PromotionCollections?.Any(promotionCode => excludedPromotionCodes.Contains(promotionCode)) ?? false)
            {
                // In case booking is in the excluded promotion codes list, we don't allow to assign it to the account
                throw new ApiException(ApiExceptionCodes.BookingHasExcludedPromotion, null, "The promotion assigned to this booking is on the exclusion list");
            }
            
            await _bookingRepository.UpdateCustomerDetails(request.BookingReference, customerId);
        }
    }
}