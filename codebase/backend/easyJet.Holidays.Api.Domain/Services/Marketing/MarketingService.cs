using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Marketing;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Marketing;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Marketing
{
    public class MarketingService : IMarketingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IHotelsService _hotelsService;
        private readonly IAWSDbRepository<MarketingPreferences> _marketingPreferencesRepository;
        private readonly ICsatService _csatService;
        private readonly ILogger<IMarketingService> _logger;
        private readonly IOfferHotelMapper _offerHotelMapper;
        private readonly MarketingSettings _marketingSettings;
        private readonly LanguageSettings _languageSettings;

        public MarketingService(
            IBookingRepository bookingRepository,
            IHotelsService hotelsService,
            IAWSDbRepository<MarketingPreferences> marketingPreferencesRepository,
            ICsatService csatService,
            ILogger<IMarketingService> logger,
            IOptions<MarketingSettings> marketingSettings,
            IOptions<LanguageSettings> languageSettings,
            IOfferHotelMapper offerHotelMapper)
        {
            _bookingRepository = bookingRepository;
            _hotelsService = hotelsService;
            _marketingPreferencesRepository = marketingPreferencesRepository;
            _csatService = csatService;
            _logger = logger;
            _offerHotelMapper = offerHotelMapper;
            _marketingSettings = marketingSettings.Value ?? throw new ArgumentNullException(nameof(marketingSettings));
            _languageSettings = languageSettings.Value ?? throw new ArgumentNullException(nameof(languageSettings));
        }

        /// <inheritdoc />
        public async Task<CustomerPreferencesResponse> GetMarketingPreferences(
            CustomerPreferencesRequest customerPreferencesRequest)
        {
            var customerPreferencesResponse = await GetMarketingPreferences(customerPreferencesRequest.Email);

            if (!customerPreferencesResponse.CanBeSent)
            {
                return customerPreferencesResponse;
            }

            var bookingResponse = await _bookingRepository.GetBooking(customerPreferencesRequest.BookingReference);

            //if trade bookings are disabled for CSAT and the current booking is a trade booking
            if (!_marketingSettings.TradeBookingsEnabled && bookingResponse.IsExternalAgency)
            {
                throw new ApiException(ApiExceptionCodes.GetMarketingPreferencesTradeBookingsError);
            }

            if (!bookingResponse.LeadPassenger.Email.Equals(customerPreferencesRequest.Email, StringComparison.OrdinalIgnoreCase))
            {
                throw new ApiException(ApiExceptionCodes.GetMarketingPreferencesValidateError);
            }

            customerPreferencesResponse.UnsubscribeLink = BuildUnsubscribeLink(customerPreferencesRequest.Email, bookingResponse.Language);

            //enrich booking response with hotel details
            var hotels = await _hotelsService.Search(new[] { bookingResponse.Package.Accom.Code });

            var hotel = hotels.FirstOrDefault();

            if (hotel != null)
            {
                bookingResponse.Hotel = hotel;
                bookingResponse.Package.Accom.Hotel = await _offerHotelMapper.MapWithoutBoardsRooms(hotel, bookingResponse.Prom);
            }
            var marketingUrlParameters = Map(bookingResponse);

            var marketingUrls = new List<string>();

            //for each satisfaction score (SAT) build an individual link by descending 
            for (var i = _marketingSettings.CsatLink.SatisfactionScore; i > 0; i--)
            {
                marketingUrlParameters.SatisfactionScore = i;

                var marketingQueryString = marketingUrlParameters.GetQueryString(new QueryStringOptions()
                {
                    QueryEncodeFunc = Uri.EscapeDataString // " " = "%20" instead "+" (requirements)
                });

                var marketingUrl = _marketingSettings.CsatLink.Host + marketingQueryString;
                marketingUrls.Add(marketingUrl);
            }

            customerPreferencesResponse.Urls = marketingUrls;

            return customerPreferencesResponse;
        }

        /// <inheritdoc />
        public async Task Unsubscribe(UnsubscribeRequest unsubscribeRequest)
        {
            var email = unsubscribeRequest?.Email ??
                        (unsubscribeRequest?.EncEmail != null
                            ? EncryptionUtils.DecryptValue(unsubscribeRequest.EncEmail, _marketingSettings.EncryptionPassword, _marketingSettings.EncryptionSalt)
                            : null);

            if (string.IsNullOrWhiteSpace(email)) throw new ArgumentNullException(nameof(email));

            try
            {
                await _csatService.UnsubscribeEmail(email);

            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to unsubscribe customer: {Email}", email);
                throw new ApiException(ApiExceptionCodes.MarketingUnsubscribeError);
            }
        }

        /// <inheritdoc />
        public async Task AddToVerify(IEnumerable<string> emails)
        {
            if (emails.IsNullOrEmpty())
            {
                return;
            }

            try
            {
                var marketingPreferences = emails.Select(s => new MarketingPreferences() { Email = s });

                await _marketingPreferencesRepository.SaveAsync(marketingPreferences);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to add emails to be checked: {Emails}", String.Join("; ", emails));
                throw new ApiException(ApiExceptionCodes.MarketingAddToVerifyError);
            }
        }

        /// <inheritdoc />
        public virtual async Task<CustomerPreferencesResponse> GetMarketingPreferences(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) throw new ArgumentNullException(nameof(email));

            try
            {
                var checkMarketingEmailConsent = await _csatService.CheckMarketingEmailConsent(email);

                var customerPreferencesResponse = new CustomerPreferencesResponse();
                customerPreferencesResponse.CanBeSent = checkMarketingEmailConsent;

                return customerPreferencesResponse;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to get customer marketing preferences for: {Email}", email);
                throw new ApiException(ApiExceptionCodes.GetMarketingPreferencesError);
            }
        }

        public string BuildUnsubscribeLink(string email, string language)
        {
            var encryptedEmail = EncryptionUtils.EncryptValue(email, _marketingSettings.EncryptionPassword, _marketingSettings.EncryptionSalt);
            var basePath = _languageSettings.BasePaths[language];

            return _marketingSettings.UnsubscribeLink
                        .Replace("{encEmail}", encryptedEmail)
                        .Replace("{basePath}", basePath);
        }

        public virtual async Task<string> DecryptEmailAddress(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) throw new ArgumentNullException(nameof(email));

            try
            {
                return EncryptionUtils.DecryptValue(email, _marketingSettings.EncryptionPassword, _marketingSettings.EncryptionSalt);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to decrypt email for: {Email}", email);
                throw new ApiException(ApiExceptionCodes.DecryptEmailError);
            }
        }

        private MarketingUrlParameters Map(BookingResponse bookingResponse)
        {
            var outboundRoute =
                bookingResponse.Package.Transport.Routes.FirstOrDefault(route => route.Direction == Direction.Outbound);

            var inboundRoute =
                bookingResponse.Package.Transport.Routes.FirstOrDefault(route => route.Direction == Direction.Inbound);

            var language = bookingResponse != null ? _marketingSettings?.LanguageMap[bookingResponse.Language] : null;

            var marketingUrlParameters = new MarketingUrlParameters()
            {
                ADate = DateFormatUtils.DateOnly(inboundRoute?.ArrDate?.DateTime),
                BrokerPanelId = bookingResponse.BookingReference,

                OutFltDT = DateFormatUtils.DateOnly(outboundRoute?.DepDate?.DateTime),
                InFltDT = DateFormatUtils.DateOnly(inboundRoute?.DepDate?.DateTime),
                OutDep = outboundRoute?.DepPt,
                OutArr = outboundRoute?.ArrPt,
                InDep = inboundRoute?.DepPt,
                InArr = inboundRoute?.ArrPt,
                PaxMix = bookingResponse?.Guests?.Count ?? 0,
                AccomCode = bookingResponse.Package.Accom.Code,
                AccomName = bookingResponse?.Hotel?.Name ?? bookingResponse?.Package?.Accom?.Hotel?.Name,
                ResortName = bookingResponse?.Hotel?.Resort?.Name ?? bookingResponse?.Package?.Accom?.Hotel?.City,
                TransferType = (int)TransfersServiceUtils.GetMarketingTransferType(
                    bookingResponse.Transfers.FirstOrDefault()?.Code, _marketingSettings?.CsatLink?.TransferTypes),
                DepFltNo = (outboundRoute?.Car ?? _marketingSettings?.CsatLink?.AirCarrier) + outboundRoute?.FltNo.Trim(), //EZY8668
                ArrFltno = (inboundRoute?.Car ?? _marketingSettings?.CsatLink?.AirCarrier) + inboundRoute?.FltNo.Trim(), //EZY8668
                FormLanguage = language?.ToLower(),
                Language = language,
                MarketCode = bookingResponse?.MarketCode,
                BookingType =
                    bookingResponse.IsExternalAgency
                        ? _marketingSettings?.CsatLink?.BookingTypeExternalAgency
                        : _marketingSettings?.CsatLink?.BookingTypeDirect,
                BoardBasis = bookingResponse.Package?.Accom?.Rooms?.FirstOrDefault()?.Board,
                Theme = bookingResponse?.Package?.Accom?.Hotel?.Theme?.Name ?? bookingResponse?.Hotel?.HotelTheme?.Name,
                HotelStarRating = bookingResponse?.Hotel?.StarRating ?? bookingResponse?.Package?.Accom?.Hotel?.StarRating,
                HasChildren = bookingResponse?.Guests?.Any(details =>
                    details.Type == PersonType.Child || details.Type == PersonType.Infant) ?? false
                    ? "Yes"
                    : "No",
                MarketingOptin = "Y",
                DevelopmentCycle = string.IsNullOrWhiteSpace(_marketingSettings?.CsatLink?.DevelopmentCycle) ? null : _marketingSettings?.CsatLink?.DevelopmentCycle
            };
            return marketingUrlParameters;
        }
    }
}