using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Mappers;
using easyJet.Holidays.External.Cms.Mappers.PromotionValidators;
using easyJet.Holidays.External.Cms.Mappers.ResponseValidators;
using easyJet.Holidays.External.Cms.Models.Common;
using easyJet.Holidays.External.Cms.Models.Promotion;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;

namespace easyJet.Holidays.External.Cms.Services
{
    /// <summary>
    /// Promotion Validator Service.
    /// </summary>
    public class PromotionValidatorService : IPromotionValidatorService
    {
        private const string GetAllPromotionsCacheKey = "PromotionValidation";

        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<PromotionValidatorService> _logger;
        private readonly ICacheService _cacheService;
        private readonly CacheSettings _cacheSettings;
        private readonly CmsResponseValidators _cmsResponseValidators;
        private readonly IReferenceDataService _referenceDataService;
        private readonly ILanguageService _languageService;
        private readonly IVouchersService _vouchersService;
        private readonly IHotelThemeService _hotelThemeService;

#pragma warning disable S107 // Methods should not have too many parameters
        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="apiService" />
        /// <param name="endpointsProvider" />
        /// <param name="httpContextAccessor" />
        /// <param name="cacheService" />
        /// <param name="cacheSettings" />
        /// <param name="cmsResponseValidators" />
        /// <param name="logger" />
        /// <param name="languageService" />
        /// <param name="referenceDataService" />
        /// <param name="vouchersService" />
        /// <param name="hotelThemeService" />
        /// <exception cref="ArgumentNullException" />
        public PromotionValidatorService(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            ICacheService cacheService,
            IOptions<CacheSettings> cacheSettings,
            CmsResponseValidators cmsResponseValidators,
            ILogger<PromotionValidatorService> logger,
            ILanguageService languageService,
            IReferenceDataService referenceDataService,
            IVouchersService vouchersService,
            IHotelThemeService hotelThemeService)
#pragma warning restore S107 // Methods should not have too many parameters
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _cacheService = cacheService;
            _logger = logger;
            _referenceDataService = referenceDataService;
            _vouchersService = vouchersService;
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _cmsResponseValidators = cmsResponseValidators;
            _languageService = languageService;
            _hotelThemeService = hotelThemeService;
        }

        /// <inheritdoc />
        public async Task<ValidatePromotion> Validate(ValidateBookingRequest validateBookingRequest)
        {
            var request = new ValidatePromotionBookingRequest()
            {
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.ValidatePromotion, _httpContextAccessor.HttpContext.Request.Cookies)
            };

            ValidatePromotionBase body = ValidatePromotionBaseMapper.BuildValidatePromotionBaseFromOffer(validateBookingRequest.Offer);
            body.VoucherCode = validateBookingRequest.DiscountCode;
            request.Payload.Body = body;

            ValidatePromotionResponse response;
            try
            {
                response = await _apiService
                     .GetResponseContentAsyncWithErrorMapping<ValidatePromotionBookingRequest, ValidatePromotionResponse>(request, ApiExceptionCodes.PromotionIsNotValid);

                return response?.Payload?.Body;
            }
            catch (Exception ex)
            {
                var apiClientError = ex.InnerException?.InnerException as ApiClientErrorResponseException;
                if (apiClientError != null && apiClientError.StatusCode != HttpStatusCode.OK)
                {
                    _logger.LogTrace(ex, "Promotion was not found in Sitecore: {DiscountCode}", validateBookingRequest.DiscountCode);
                    return null;
                }

                throw;
            }
        }

        /// <inheritdoc />
        public async Task<PromocodeDiscount> GetPromocodeDiscountsForOffers(MatchPromocodesRequestBase matchPromocodesRequestBase)
        {
            var promoCodeSettings = await _referenceDataService.GetPromoCodeSetting();

            var request = new MatchPromocodesRequest()
            {
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.MatchPromocodes, _httpContextAccessor.HttpContext.Request.Cookies)
            };

            request.Payload.Body = BuildBaseRequestItem(matchPromocodesRequestBase, promoCodeSettings);

            MatchPromocodesResponse response;
            try
            {
                response = await _apiService
                     .GetResponseContentAsyncWithErrorMapping<MatchPromocodesRequest, MatchPromocodesResponse>(request, ApiExceptionCodes.PromotionIsNotValid);

                return response?.Payload?.Body;
            }
            catch (Exception ex)
            {
                var apiClientError = ex.InnerException?.InnerException as ApiClientErrorResponseException;
                if (apiClientError != null && apiClientError.StatusCode != HttpStatusCode.OK)
                {
                    _logger.LogTrace(ex, "Promotion was not found in Sitecore: {DiscountCode}", matchPromocodesRequestBase.VoucherCode);
                    return null;
                }

                throw;
            }
        }

        /// <inheritdoc />
        public async Task<ValidatePromotion> ValidateByAtcomPromoCode(Offer offer, string atcomPromoCode, string marketCode)
        {
            var request = new GetCustomerPromoCodeRequest()
            {
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetCustomerPromoCode, _httpContextAccessor.HttpContext.Request.Cookies)
            };

            var validateRequest = new ValidatePromotionBookingRequest()
            {
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.ValidatePromotion, _httpContextAccessor.HttpContext.Request.Cookies)
            };

            request.Payload.Body = new GetCustomerPromoCodeBase { AtcomPromoCode = atcomPromoCode, MarketCode = marketCode };
            string customerPromoCode;

            try
            {
                var promoCodeResponse = await _apiService
                     .GetResponseContentAsyncWithErrorMapping<GetCustomerPromoCodeRequest, GetCustomerPromoCodeResponse>(request, ApiExceptionCodes.PromotionIsNotValid);
                customerPromoCode = promoCodeResponse?.Payload?.Body;
            }
            catch (Exception ex)
            {
                _logger.LogTrace(ex, "Promotion was not found in Sitecore: {DiscountCode}", atcomPromoCode);
                return null;
            }


            var promoCodeSettings = await _referenceDataService.GetPromoCodeSetting();
            validateRequest.Payload.Body = ValidatePromotionBaseMapper.BuildBaseRequestItem(offer, promoCodeSettings, customerPromoCode, marketCode);
            validateRequest.ValidateResponse = _cmsResponseValidators.ValidateAtcomResponseCatchApiPromocodeErrorsAction;

            ValidatePromotionResponse response;
            try
            {
                response = await _apiService
                     .GetResponseContentAsyncWithCustomErrorMapping<ValidatePromotionBookingRequest, ValidatePromotionResponse>(validateRequest, ApiExceptionCodes.PromotionIsNotValid);

                return response?.Payload?.Body;
            }
            catch (Exception ex)
            {
                var apiClientError = ex.InnerException?.InnerException as ApiClientErrorResponseException;
                if (apiClientError != null && apiClientError.StatusCode != HttpStatusCode.OK)
                {
                    _logger.LogTrace(ex, "Promotion was not found in Sitecore: {DiscountCode}", customerPromoCode);
                    return null;
                }

                throw;
            }
        }

        /// <inheritdoc />
        public async Task<bool> PromoExists(string promoCode)
        {
            var request = new ValidatePromotionBookingRequest()
            {
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.ValidatePromotion,
                    _httpContextAccessor.HttpContext.Request.Cookies),
                Payload = new JsonApiPayload<ValidatePromotionBase>()
                {
                    Body = new ValidatePromotionBase()
                    {
                        VoucherCode = promoCode
                    }
                }
            };

            try
            {
                var validatePromotionResponse = await _apiService
                    .GetResponseContentAsyncWithErrorMapping<ValidatePromotionBookingRequest, ValidatePromotionResponse>(request, ApiExceptionCodes.PromotionIsNotValid); ;

                return validatePromotionResponse?.Payload?.Body != null;
            }
            catch (Exception ex)
            {
                var errorResponseException = ex.InnerException as ErrorResponseException;

                //promotion found in CMS, but has validation errors.
                //we ignore validation errors because we are only interested in the presence of a promo in the CMS.
                if (errorResponseException?.ApiErrors != null && errorResponseException.ApiErrors.Any())
                {
                    return true;
                }

                //in all other cases, we consider that the promotion was not found in CMS
                _logger.LogTrace(ex, "Promotion was not found in CMS: {PromoCode}", promoCode);

                return false;
            }
        }

        /// <inheritdoc />
        public async Task<AccommodationOffersResponse> ExtendOffersWithPromotions(AccommodationOffersResponse accomodationOffers, IEnumerable<Hotel> hotels)
        {
            return await GetPromotions(accomodationOffers, (req) => req.Offers, hotels);
        }

        /// <inheritdoc />
        public async Task<SearchOffersResponse> ExtendOffersWithPromotions(SearchOffersResponse searchOffers, IEnumerable<Hotel> hotels)
        {
            return await GetPromotions(searchOffers, (req) => req.Offers, hotels);
        }

        /// <inheritdoc />
        public async Task<IEnumerable<LivePriceSummaryModel>> ExtendOffersWithPromotions(List<LivePriceSummaryModel> livePrice, IEnumerable<Hotel> hotels)
        {
            try
            {
                var dataItems = livePrice.Select(x => ValidatePromotionBaseMapper.BuildBaseRequestItemFromLivePriceSummaryModel(x)).ToList();

                var responseBody = await GetPromotionsInfo(dataItems, hotels);

                if (responseBody != null)
                {
                    livePrice.ForEach(x =>
                    {
                        if (!string.IsNullOrEmpty(x.Geog) && responseBody.TryGetValue(x.AccomCode, out var vouchers))
                        {
                            x.Promotion = vouchers.FirstOrDefault();
                        }
                    });
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to get promotions for offers");
            }
            return livePrice;
        }
        
        
        /// <summary>
        /// Get promotions for the package
        /// </summary>
        /// <param name="validateBookingResponse">validate booking response</param>
        /// <param name="validateBookingRequest">validate booking request to get promotions</param>
        /// <returns>>validate booking response</returns>
        public async Task<ValidateBookingResponse> ExtendValidatePackageWithPromotions(ValidateBookingResponse validateBookingResponse, ValidateBookingRequest validateBookingRequest)
        {
            if (validateBookingResponse == null || validateBookingRequest == null)
            {
                return validateBookingResponse;
            }

            var promotions = await GetAllPromotions();

            if (promotions == null || promotions.Count == 0)
            {
                return validateBookingResponse;
            }
            
            var booking = ValidatePromotionBaseMapper.BuildBaseRequestItemFromValidatePackageRequest(validateBookingRequest, validateBookingResponse.PaymentInfo);
            var destinationByHotel = new Dictionary<string, List<DatasourceObject>>()
            {
                {
                    validateBookingRequest.Offer.Accom.Code, [
                        BuildDestinationDatasourceObject(validateBookingRequest.Offer.Hotel.Resort),
                        BuildDestinationDatasourceObject(validateBookingRequest.Offer.Hotel.Location),
                        BuildDestinationDatasourceObject(validateBookingRequest.Offer.Hotel.Country),
                        new DatasourceObject()
                        {
                            Code = validateBookingRequest.Offer.Hotel?.GiataCode,
                            Name = validateBookingRequest.Offer.Hotel?.Name
                        }
                    ]
                }
            };
            var result = GetPromotionsGroupedByHotelCodes([booking], promotions, destinationByHotel);
            if (result == null || result.Count == 0)
            {
                return validateBookingResponse;
            }
            
            validateBookingResponse.Promotion = result[validateBookingRequest.Offer.Accom.Code].FirstOrDefault();
            return validateBookingResponse;
        }

        /// <inheritdoc />
        public async Task<CmsPromocode> GetAtcomPromoCode(Offer offer, string discountCode, string marketCode)
        {
            if (string.IsNullOrEmpty(discountCode))
                return new();

            var validatePromotion = await ValidateByAtcomPromoCode(offer, discountCode, marketCode);
            var promocode = await _vouchersService.MapDiscountToAtcomCode(validatePromotion?.VoucherCode) ?? string.Empty;
            return new()
            {
                ValidationResults = validatePromotion?.ValidationResults,
                Promocode = promocode
            };
        }
        
        /// <summary>
        /// Builds Destination Datasource Object.
        /// </summary>
        /// <param name="destination">Destination.</param>
        /// <returns>Returns country Datasource.</returns>
        private static DatasourceObject BuildDestinationDatasourceObject(IDestinationDatasource destination)
        {
            return new DatasourceObject()
            {
                Code = destination.Code,
                Name = destination.Name,
            };
        }
        
        /// <summary>
        /// Validates Promotion and Promotion Codes.
        /// </summary>
        /// <param name="promotion">Promotion.</param>
        /// <param name="booking">Booking</param>
        /// <param name="result">Results of validation.</param>
        private static void ValidatePromotion(PromotionCmsModel promotion, ValidateCmsBooking booking, Dictionary<string, List<SinglePromotionInfo>> result)
        {
            var promotionValidationResult = Validate(promotion.ValidationRules, booking, CascadeMode.Stop);
            if (!promotionValidationResult.IsValid)
            {
                return;
            }

            foreach (var promotionCode in promotion.PromotionCodes)
            {
                var promotionCodeValidationResult = Validate(promotionCode.ValidationRules, booking, CascadeMode.Stop);

                if (!promotionCodeValidationResult.IsValid)
                {
                    continue;
                }
                        
                var promo = ToSinglePromotionInfo(promotion, promotionCode, promotion.PromotionCodes);

                // Should return description instead of title.
                if (!result.TryGetValue(booking.HotelCode, out List<SinglePromotionInfo> value))
                {
                    result.Add(booking.HotelCode, [promo]);
                }
                else
                {
                    value.Add(promo);
                }
                            
                return;
            }
        }
        
        private static Dictionary<string, List<SinglePromotionInfo>> GetPromotionsGroupedByHotelCodes(List<ValidatePromotionBase> validateBookingRequests, IEnumerable<PromotionCmsModel> promotions, Dictionary<string, List<DatasourceObject>> destinationsByHotel)
        {
            var bookings = ValidateBookingRequestMapper.MapFromValidateBookingRequest(validateBookingRequests, destinationsByHotel);

            var result = new Dictionary<string, List<SinglePromotionInfo>>();
            var validPromotions = promotions.Where(p => p is { Id : not null, PromotionCodes: not null }).ToList();
            foreach (var booking in bookings)
            {   
                foreach (var promotion in validPromotions)
                {
                    ValidatePromotion(promotion, booking, result); 
                }
            }
            return result;
        }
        
        private static FluentValidation.Results.ValidationResult Validate(ValidationRules rules, ValidateCmsBooking validateBooking, CascadeMode cascadeMode)
        {
            return new PromotionValidator(cascadeMode, rules).Validate(validateBooking);
        }

        private static FluentValidation.Results.ValidationResult Validate(PromotionCodeValidationRules rules, ValidateCmsBooking validateBooking, CascadeMode cascadeMode)
        {
            return new PromotionCodeValidator(cascadeMode, rules).Validate(validateBooking);
        }
        
        private static Dictionary<string, List<DatasourceObject>> GetDestinationsByHotels(IEnumerable<Hotel> hotels)
        {
            var destinations = new Dictionary<string, List<DatasourceObject>>();

            foreach (var hotel in hotels)
            {
                destinations.Add(hotel.Code, new List<DatasourceObject>()
                {

                    BuildDestinationDatasourceObject(hotel.Country),
                    BuildDestinationDatasourceObject(hotel.Location),
                    BuildDestinationDatasourceObject(hotel.Resort),
                    new DatasourceObject()
                    {
                        Code = hotel.GiataCode,
                        Name = hotel.Name
                    }
                });
            }

            return destinations;
        }
        
        /// <summary>
        /// Compiles valid promo code into one object with all tiers for promotion banner.
        /// </summary>
        /// <param name="promotion">Cms Promotion Data.</param>
        /// <param name="promotionCode">Promotion Code Cms Data.</param>
        /// <param name="promoTiers">Promo Codes tiers.</param>
        /// <returns>Single promotion info object.</returns>
        private static SinglePromotionInfo ToSinglePromotionInfo(
            PromotionCmsModel promotion,
            PromotionCodeCmsModel promotionCode,
            IEnumerable<PromotionCodeCmsModel> promoTiers)
        {
            return new SinglePromotionInfo()
            {
                Title = promotion.Title,
                CardDescription = promotion.CardDescription,
                Icon = promotion.Icon,
                BannerTitle = promotion.BannerTitle,
                MinimumSpendText = promotion.MinimumSpend,
                MinimumSpendValue = promotionCode.MinimumSpend,
                PromoCode = promotion.PromoCode,
                Date = promotion.Date,
                TandCs = promotion.TandCs,
                DisplayOnExtrasPage =  promotion.DisplayOnExtrasPage,
                ShowTaxesNote = promotion.ShowTaxesNote,
                DiscountAmountPerBooking = promotionCode.DiscountAmountPerBooking,
                PercentageDiscountPerBooking = promotionCode.PercentageDiscountPerBooking,
                DiscountPercentagePerPerson = promotionCode.AdultPercentageAmountPerPerson,
                DiscountAmountPerPerson = promotionCode.AdultDiscountAmountPerPerson,
                ChildDiscountPercentagePerPerson = promotionCode.ChildPercentageAmountPerPerson,
                ChildDiscountAmountPerPerson = promotionCode.ChildDiscountAmountPerPerson,
                PromotionCodeTiers = promoTiers.Where(x => !x.HideOnPromoBanner).OrderBy(p => p.MinimumSpend).Select(ToPromotionCodeTier),
            };
        }

        private static PromotionCodeTier ToPromotionCodeTier(PromotionCodeCmsModel promoCodeCms) => new PromotionCodeTier
        {
            MinimumSpend = promoCodeCms.MinimumSpend,
            MinimumSpendPerPerson = promoCodeCms.MinimumSpendPerPerson,
            PercentageDiscountPerBooking = promoCodeCms.PercentageDiscountPerBooking,
            DiscountAmountPerBooking = promoCodeCms.DiscountAmountPerBooking,
            DiscountPercentagePerPerson = promoCodeCms.AdultPercentageAmountPerPerson,
            DiscountAmountPerPerson = promoCodeCms.AdultDiscountAmountPerPerson,
            ChildDiscountPercentagePerPerson = promoCodeCms.ChildPercentageAmountPerPerson,
            ChildDiscountAmountPerPerson = promoCodeCms.ChildDiscountAmountPerPerson,
        };

        private MatchPromocodesRequestBody BuildBaseRequestItem(MatchPromocodesRequestBase matchPromocodesRequestBase, PromoCodeSettings promoCodeSettings)
        {
            return new MatchPromocodesRequestBody
            {
                VoucherCode = matchPromocodesRequestBase.VoucherCode,
                ValidateBookingRequests = matchPromocodesRequestBase.ValidateBookingRequests
                    .Select(x => ValidatePromotionBaseMapper.BuildBaseRequestItem(x, promoCodeSettings)).ToList()
            };
        }

        /// <summary>
        /// Fires promotions request
        /// </summary>
        /// <param name="offersResponse">Offers to check available promotions</param>
        /// <param name="action">Action to extract offers</param>
        /// <returns></returns>
        private async Task<T> GetPromotions<T>(T offersResponse, Func<T, List<Offer>> action, IEnumerable<Hotel> hotels)
        {
            if (action(offersResponse)?.Any() != true)
            {
                return offersResponse;
            }
            try
            {
                var offersList = action(offersResponse);

                var dataItems = offersList.Select(x => ValidatePromotionBaseMapper.BuildValidatePromotionBaseFromOffer(x)).ToList();

                var responseBody = await GetPromotionsInfo(dataItems, hotels);

                if (responseBody != null)
                {
                    offersList.ForEach(x =>
                    {
                        if (responseBody.TryGetValue(x.Accom?.Id ?? "", out var vouchers))
                        {
                            x.Promotion = vouchers.FirstOrDefault();
                        }
                    });
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to get promotions for offers");
            }
            return offersResponse;
        }

        private async Task<Dictionary<string, List<SinglePromotionInfo>>> GetPromotionsInfo(List<ValidatePromotionBase> dataItems, IEnumerable<Hotel> hotels)
        {
            var promotions = await GetAllPromotions();

            var hotelsList = hotels.ToList();
            var destinations = GetDestinationsByHotels(hotelsList);

            await ExtendRequestItemsWithHotelData(dataItems, hotelsList);

            return GetPromotionsGroupedByHotelCodes(dataItems, promotions, destinations);
        }

        /// <summary>
        /// Gets all promotions configured in SC from cache or caching response from SC for promotions.
        /// </summary>
        /// <returns>List of promotions.</returns>
        private async Task<List<PromotionCmsModel>> GetAllPromotions()
        {
            var lang = _languageService?.GetCurrentLanguage() ?? string.Empty;
            
            var promotions = await _cacheService.GetOrAddAsync(
                _cacheSettings.Buckets.CmsPromotions,
                [GetAllPromotionsCacheKey, lang],
                async () =>
                {
                    var request = new GetAllPromotionsRequest();
                    request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetAllPromotions, _httpContextAccessor.HttpContext.Request.Cookies);
                    var response = await _apiService.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(request);
                    return response.Payload.Body;
                },
                false);

            return promotions ?? [];
        }

        /// <summary>
        /// Extend data items with additional info from hotel that requires for promo code validation.
        /// </summary>
        private async Task ExtendRequestItemsWithHotelData(List<ValidatePromotionBase> dataItems, List<Hotel> hotels)
        {
            foreach (var request in dataItems)
            {
                if (request.HotelType == null)
                {
                    var hotel = hotels.FirstOrDefault(x => x.Code == request.HotelCode);
                    if (hotel != null)
                    {
                        var hotelType = await _hotelThemeService.GetHotelType(hotel.FacilityMatrix, request.NChildren,
                            request.NInfants);
                        request.HotelType = hotelType?.Code;
                    }
                }
            }
        }
    }
}