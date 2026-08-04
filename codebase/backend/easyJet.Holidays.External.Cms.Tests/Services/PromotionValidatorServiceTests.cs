using AutoFixture;
using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Mappers.ResponseValidators;
using easyJet.Holidays.External.Cms.Models.Common;
using easyJet.Holidays.External.Cms.Models.Promotion;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Location = easyJet.Holidays.Api.Domain.Data.Hotels.Location;

namespace easyJet.Holidays.External.Cms.Tests.Services
{
    public class PromotionValidatorServiceTests
    {
        private IOptions<CacheSettings> _cacheSettings;
        private Mock<IReferenceDataService> _referenceDataServiceMock = new Mock<IReferenceDataService>();
        private Mock<IVouchersService> _vouchersServiceMock = new Mock<IVouchersService>();
        private Mock<IHotelThemeService> _hotelThemeServiceMock = new Mock<IHotelThemeService>();

        public PromotionValidatorServiceTests()
        {
            _cacheSettings = Options.Create(new CacheSettings
            {
                Buckets = new Buckets
                {
                    CmsPromotions = "CmsPromotions"
                }
            });
        }

        [Theory, AutoMoqData]
        public async Task Validate_ThrowApiException_IfBookingIsNotValid(
            ValidateBookingRequest request,
            [Frozen] Mock<IApiService> apiServiceMock,
            [Frozen] Mock<IHttpContextAccessor> httpContextAccessorMock,
            [Frozen] Mock<ILogger<PromotionValidatorService>> loggerMock,
            [Frozen] Mock<ICacheService> cacheServiceMock,
            [Frozen] Mock<CmsResponseValidators> cmsResponseValidatorsMock)
        {
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            var response = new ValidatePromotionResponse()
            {
                Payload = new JsonApiPayload<ValidatePromotion>()
                {
                    Body = new ValidatePromotion()
                    {
                        VoucherCode = "TEST_VOUCHER_CODE",
                        ValidationResults = new[]
                         {
                                new ApiError()
                                {
                                    Code = "INVALID_AIRPORT",
                                    Message = "Airport is invalid."
                                }
                         }
                    }
                }
            };

            // Arrange
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<ValidatePromotionBookingRequest, ValidatePromotionResponse>(It.IsAny<ValidatePromotionBookingRequest>()))
                .ThrowsAsync(new ErrorResponseException(response, "Response has errors", response.ApiErrors, null));


            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock.Object,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act & Assert 
            await service.Invoking(x => x.Validate(request))
              .Should().ThrowExactlyAsync<ApiException>();
        }

        [Theory, AutoMoqData]
        public async Task Validate_PromotionWasNotFoundInSitecore_ReturnNull(
           ValidateBookingRequest request,
           [Frozen] Mock<IApiService> apiServiceMock,
           [Frozen] Mock<IHttpContextAccessor> httpContextAccessorMock,
           [Frozen] Mock<ILogger<PromotionValidatorService>> loggerMock,
            [Frozen] Mock<ICacheService> cacheServiceMock,
            [Frozen] Mock<CmsResponseValidators> cmsResponseValidatorsMock)
        {
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);


            // Arrange
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<ValidatePromotionBookingRequest, ValidatePromotionResponse>(It.IsAny<ValidatePromotionBookingRequest>()))
                .ThrowsAsync(new Exception("Exception", new Exception("Inner Exception", new ApiClientErrorResponseException(System.Net.HttpStatusCode.NotFound, null))));


            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock.Object,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.Validate(request);
            actual?.VoucherCode.Should().BeNullOrEmpty();
            actual?.ValidationResults.Should().BeNull();
        }

        [Theory, AutoMoqData]
        public async Task Validate_ReturnSitecoreId_IfPromotionWasFoundInSitecore(
           ValidateBookingRequest request,
           [Frozen] Mock<IApiService> apiServiceMock,
           [Frozen] Mock<IHttpContextAccessor> httpContextAccessorMock,
           [Frozen] Mock<ILogger<PromotionValidatorService>> loggerMock,
           ValidatePromotionResponse response,
            [Frozen] Mock<ICacheService> cacheServiceMock,
            [Frozen] Mock<CmsResponseValidators> cmsResponseValidatorsMock)
        {
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<ValidatePromotionBookingRequest, ValidatePromotionResponse>(It.IsAny<ValidatePromotionBookingRequest>()))
                .ReturnsAsync(response);


            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock.Object,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.Validate(request);
            actual.VoucherCode.Should().Be(response.Payload.Body.VoucherCode);
        }

        [Theory, AutoMoqData]
        public async Task PromoExists_PromotionWasNotFoundInSitecore_ReturnFalse(
            string promoCode,
            [Frozen] Mock<IApiService> apiServiceMock,
            [Frozen] Mock<IHttpContextAccessor> httpContextAccessorMock,
            [Frozen] Mock<ILogger<PromotionValidatorService>> loggerMock,
            [Frozen] Mock<ICacheService> cacheServiceMock,
            [Frozen] Mock<CmsResponseValidators> cmsResponseValidatorsMock)
        {
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);


            // Arrange
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<ValidatePromotionBookingRequest, ValidatePromotionResponse>(It.IsAny<ValidatePromotionBookingRequest>()))
                .ThrowsAsync(new Exception("Exception", new Exception("Inner Exception", new ApiClientErrorResponseException(System.Net.HttpStatusCode.NotFound, null))));


            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock.Object,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.PromoExists(promoCode);
            actual.Should().BeFalse();
        }

        [Theory, AutoMoqData]
        public async Task PromoExists_PromotionWasFoundInSitecore_ReturnTrue(
            string promoCode,
            [Frozen] Mock<IApiService> apiServiceMock,
            [Frozen] Mock<IHttpContextAccessor> httpContextAccessorMock,
            [Frozen] Mock<ILogger<PromotionValidatorService>> loggerMock,
            ValidatePromotionResponse response,
            [Frozen] Mock<ICacheService> cacheServiceMock,
            [Frozen] Mock<CmsResponseValidators> cmsResponseValidatorsMock)
        {
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<ValidatePromotionBookingRequest, ValidatePromotionResponse>(It.IsAny<ValidatePromotionBookingRequest>()))
                .ReturnsAsync(response);


            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock.Object,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.PromoExists(promoCode);
            actual.Should().BeTrue();
        }

        [Theory, AutoMoqData]
        public async Task PromoExists_PromotionFoundButHasValidationError_ReturnTrue(
            string promoCode,
            [Frozen] Mock<IApiService> apiServiceMock,
            [Frozen] Mock<IHttpContextAccessor> httpContextAccessorMock,
            [Frozen] Mock<ILogger<PromotionValidatorService>> loggerMock,
            [Frozen] Mock<ICacheService> cacheServiceMock,
            [Frozen] Mock<CmsResponseValidators> cmsResponseValidatorsMock)
        {
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            var response = new ValidatePromotionResponse()
            {
                Payload = new JsonApiPayload<ValidatePromotion>()
                {
                    Body = new ValidatePromotion()
                    {
                        VoucherCode = "TEST_VOUCHER_CODE",
                        ValidationResults = new[]
                         {
                                new ApiError()
                                {
                                    Code = "INVALID_AIRPORT",
                                    Message = "Airport is invalid."
                                }
                         }
                    }
                }
            };

            // Arrange
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<ValidatePromotionBookingRequest, ValidatePromotionResponse>(It.IsAny<ValidatePromotionBookingRequest>()))
                .ThrowsAsync(new ErrorResponseException(response, "Response has errors", response.ApiErrors, null));


            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock.Object,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.PromoExists(promoCode);

            //true, since promotion was found, but validation failed
            actual.Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.AccommodationOffersResponse_Valid), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendOffersWithPromotions_AccommodationOffersResponse_Valid(
            AccommodationOffersResponse request,
            GetAllPromotionsResponse response,
            AccommodationOffersResponse result,
            IEnumerable<Hotel> hotels)
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var cacheServiceMock = new CacheServiceStub();

            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()))
                .ReturnsAsync(response);

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.ExtendOffersWithPromotions(request, hotels);
            actual.Should().BeEquivalentTo(result);
        }

        [Theory, AutoMoqData]
        public async Task ExtendOffersWithPromotions_AccommodationOffersResponse_Failed(
            AccommodationOffersResponse request,
            [Frozen] Mock<IApiService> apiServiceMock,
            [Frozen] Mock<IHttpContextAccessor> httpContextAccessorMock,
            [Frozen] Mock<Logger<PromotionValidatorService>> loggerMock,
            [Frozen] Mock<ICacheService> cacheServiceMock,
            [Frozen] Mock<CmsResponseValidators> cmsResponseValidatorsMock,
            IEnumerable<Hotel> hotels)
        {
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()))
                .ThrowsAsync(new ApiException(ApiExceptionCodes.FailedToLoadOffersPromotions));

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock.Object,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.ExtendOffersWithPromotions(request, hotels);
            // Should be the same response
            actual.Should().BeEquivalentTo(request);
        }

        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.SearchOffersResponse_Valid), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendOffersWithPromotions_SearchOffersResponse_Valid(
            SearchOffersResponse request,
            GetAllPromotionsResponse response,
            SearchOffersResponse result,
            IEnumerable<Hotel> hotels)
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var cacheServiceMock = new CacheServiceStub();
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()))
                .ReturnsAsync(response);

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.ExtendOffersWithPromotions(request, hotels);
            actual.Should().BeEquivalentTo(result);
        }

        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.GetPromocodeDiscountsForOffers_Valid), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task GetPromocodeDiscountsForOffers_PromocodeDiscount_Valid(
            MatchPromocodesRequestBase request,
            MatchPromocodesResponse response,
            PromocodeDiscount result
            )
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var langService = fixture.Freeze<Mock<ILanguageService>>();
            var cacheServiceMock = new CacheServiceStub();
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<MatchPromocodesRequest, MatchPromocodesResponse>(It.IsAny<MatchPromocodesRequest>()))
                .ReturnsAsync(response);

            _referenceDataServiceMock.Setup(x => x.GetPromoCodeSetting())
                .ReturnsAsync(new PromoCodeSettings { IsPromoCodeEnabled = true, IsSeatsCalculationIncluded = false });

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                langService.Object,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.GetPromocodeDiscountsForOffers(request);
            actual.Should().BeEquivalentTo(result);
        }

        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.GetPromocodeDiscountsForOffers_Invalid), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task GetPromocodeDiscountsForOffers_PromocodeDiscount_Failed(
            MatchPromocodesRequestBase request
            )
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var langService = fixture.Freeze<Mock<ILanguageService>>();
            var cacheServiceMock = new CacheServiceStub();
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<MatchPromocodesRequest, MatchPromocodesResponse>(It.IsAny<MatchPromocodesRequest>()))
                .ThrowsAsync(new Exception("Exception", new Exception("Inner Exception", new ApiClientErrorResponseException(System.Net.HttpStatusCode.NotFound, null))));

            _referenceDataServiceMock.Setup(x => x.GetPromoCodeSetting())
                .ReturnsAsync(new PromoCodeSettings { IsPromoCodeEnabled = true, IsSeatsCalculationIncluded = false });

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                langService.Object,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.GetPromocodeDiscountsForOffers(request);
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.LivePrice_Valid), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendOffersWithPromotions_Live_Price(
            IEnumerable<LivePriceSummaryModel> livePriceRequest,
            GetAllPromotionsResponse response,
            IEnumerable<LivePriceSummaryModel> livePriceResponse,
            IEnumerable<Hotel> hotels,
            ThemeType themeType
            )
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var cacheServiceMock = new CacheServiceStub();
            var cacheService = new Mock<ICacheService>();
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()))
                .ReturnsAsync(response);

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            _hotelThemeServiceMock.Setup(hts => hts.GetHotelType(hotels.First().FacilityMatrix, livePriceRequest.First().SearchCriteria.Children, livePriceRequest.First().SearchCriteria.Infants))
                .ReturnsAsync(themeType);

            cacheService.Setup(cs => cs.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<IEnumerable<PromotionCmsModel>>>>(), It.IsAny<bool>()))
                .ReturnsAsync(response.Payload.Body);
            //Act
            var actual = await service.ExtendOffersWithPromotions(livePriceRequest.ToList(), hotels);
            actual.Should().BeEquivalentTo(livePriceResponse);
        }
        
        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.LivePrice_Valid_MorePromotions), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendOffersWithPromotions_Live_Price_MultiplePromos(
            IEnumerable<LivePriceSummaryModel> livePriceRequest,
            GetAllPromotionsResponse response,
            IEnumerable<LivePriceSummaryModel> livePriceResponse,
            IEnumerable<Hotel> hotels,
            ThemeType themeType
            )
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var cacheServiceMock = new CacheServiceStub();
            var cacheService = new Mock<ICacheService>();
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings()
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()))
                .ReturnsAsync(response);

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            _hotelThemeServiceMock.Setup(hts => hts.GetHotelType(hotels.First().FacilityMatrix, livePriceRequest.First().SearchCriteria.Children, livePriceRequest.First().SearchCriteria.Infants))
                .ReturnsAsync(themeType);

            cacheService.Setup(cs => cs.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<IEnumerable<PromotionCmsModel>>>>(), It.IsAny<bool>()))
                .ReturnsAsync(response.Payload.Body);
            //Act
            var actual = await service.ExtendOffersWithPromotions(livePriceRequest.ToList(), hotels);
            actual.Should().BeEquivalentTo(livePriceResponse);
        }
        
        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.LivePrice_PromotionNotValid), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendOffersWithPromotions_Live_Price_PromotionsAreNotValid(
            IEnumerable<LivePriceSummaryModel> livePriceRequest,
            GetAllPromotionsResponse response,
            IEnumerable<LivePriceSummaryModel> livePriceResponse,
            IEnumerable<Hotel> hotels,
            ThemeType themeType
            )
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var cacheServiceMock = new CacheServiceStub();
            var cacheService = new Mock<ICacheService>();
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings()
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()))
                .ReturnsAsync(response);

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            _hotelThemeServiceMock.Setup(hts => hts.GetHotelType(hotels.First().FacilityMatrix, livePriceRequest.First().SearchCriteria.Children, livePriceRequest.First().SearchCriteria.Infants))
                .ReturnsAsync(themeType);

            cacheService.Setup(cs => cs.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<IEnumerable<PromotionCmsModel>>>>(), It.IsAny<bool>()))
                .ReturnsAsync(response.Payload.Body);
            //Act
            var actual = await service.ExtendOffersWithPromotions(livePriceRequest.ToList(), hotels);
            actual.First().Promotion.Should().BeNull();
        }
        
        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.LivePrice_PromotionCodeNotValid), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendOffersWithPromotions_Live_Price_PromotionCodesAreNotValid(
            IEnumerable<LivePriceSummaryModel> livePriceRequest,
            GetAllPromotionsResponse response,
            IEnumerable<LivePriceSummaryModel> livePriceResponse,
            IEnumerable<Hotel> hotels,
            ThemeType themeType
            )
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var cacheServiceMock = new CacheServiceStub();
            var cacheService = new Mock<ICacheService>();
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()))
                .ReturnsAsync(response);

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            _hotelThemeServiceMock.Setup(hts => hts.GetHotelType(hotels.First().FacilityMatrix, livePriceRequest.First().SearchCriteria.Children, livePriceRequest.First().SearchCriteria.Infants))
                .ReturnsAsync(themeType);

            cacheService.Setup(cs => cs.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<IEnumerable<PromotionCmsModel>>>>(), It.IsAny<bool>()))
                .ReturnsAsync(response.Payload.Body);
            //Act
            var actual = await service.ExtendOffersWithPromotions(livePriceRequest.ToList(), hotels);
            actual.First().Promotion.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.SearchOffersResponse_ValidWithHotelTypes), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendRequestItemsWithHotelData_ShouldNotSetHotelType_WhenHotelTypeIsAlreadySet(
            SearchOffersResponse request,
            GetAllPromotionsResponse response,
            SearchOffersResponse result,
            IEnumerable<Hotel> hotels)
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var hotelThemeServiceMock = fixture.Freeze<Mock<IHotelThemeService>>();
            var cacheServiceMock = new CacheServiceStub();
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();

            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                hotelThemeServiceMock.Object);

            //Act
            await service.ExtendOffersWithPromotions(request, hotels);

            // Assert
            hotelThemeServiceMock.Verify(
                x => x.GetHotelType(It.IsAny<HotelType[]>(), It.IsAny<int>(), It.IsAny<int>()),
                Times.Never);
        }
        
        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.ValidateBookingResponse_Valid), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendValidatePackageWithPromotions_ValidatePackageResponse_NoPromotions(
            ValidateBookingRequest request,
            GetAllPromotionsResponse response,
            ValidateBookingResponse result)
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var cacheServiceMock = new CacheServiceStub();

            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()))
                .ReturnsAsync(response);

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.ExtendValidatePackageWithPromotions(result, request);
            actual.Should().BeEquivalentTo(result);
        }
        
        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.ValidateBookingResponse_HasPromotions), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendValidatePackageWithPromotions_ValidatePackageResponse_HasPromotions(
            ValidateBookingRequest request,
            GetAllPromotionsResponse response,
            ValidateBookingResponse result)
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var cacheServiceMock = new CacheServiceStub();

            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()))
                .ReturnsAsync(response);

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);
    
            //Act
            var actual = await service.ExtendValidatePackageWithPromotions(new ValidateBookingResponse() { PaymentInfo = new PriceInfo() }, request);
            actual.Should().BeEquivalentTo(result);
        }
        
        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.ValidateBookingResponse_IsNull), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendValidatePackageWithPromotions_ValidatePackageResponse_Null(
            ValidateBookingRequest request,
            GetAllPromotionsResponse response,
            ValidateBookingResponse result)
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var cacheServiceMock = new CacheServiceStub();

            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Arrange
            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()))
                .ReturnsAsync(response);

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            //Act
            var actual = await service.ExtendValidatePackageWithPromotions(result, request);
            actual.Should().BeEquivalentTo(result);
        }

        [Theory]
        [MemberData(nameof(ExtendOffersWithPromotions_Data.ValidateBookingRequest_IsNull), MemberType = typeof(ExtendOffersWithPromotions_Data))]
        public async Task ExtendValidatePackageWithPromotions_ValidateBookingRequest_Null_ReturnsOriginalResponseAndSkipsCmsCall(
            ValidateBookingResponse response)
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            var httpContextAccessorMock = fixture.Freeze<Mock<IHttpContextAccessor>>();
            var loggerMock = fixture.Freeze<Mock<ILogger<PromotionValidatorService>>>();
            var cmsResponseValidatorsMock = fixture.Freeze<Mock<CmsResponseValidators>>();
            var cacheServiceMock = new CacheServiceStub();

            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            var endpointsProvider = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            var apiServiceMock = fixture.Freeze<Mock<IApiService>>();

            var service = new PromotionValidatorService(
                apiServiceMock.Object,
                endpointsProvider,
                httpContextAccessorMock.Object,
                cacheServiceMock,
                _cacheSettings,
                cmsResponseValidatorsMock.Object,
                loggerMock.Object,
                null,
                _referenceDataServiceMock.Object,
                _vouchersServiceMock.Object,
                _hotelThemeServiceMock.Object);

            // Act
            var actual = await service.ExtendValidatePackageWithPromotions(response, null);

            // Assert
            actual.Should().BeSameAs(response);
            apiServiceMock.Verify(
                x => x.GetResponseContentAsync<GetAllPromotionsRequest, GetAllPromotionsResponse>(It.IsAny<GetAllPromotionsRequest>()),
                Times.Never);
        }

        public class ExtendOffersWithPromotions_Data
        {
            public static IEnumerable<object[]> AccommodationOffersResponse_Valid()
            {
                yield return new object[] {
                    new AccommodationOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() {
                                    Code= "TEST_ID",
                                    Id = "TEST_ID" },
                            }
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                    },
                    new AccommodationOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Code= "TEST_ID", Id = "TEST_ID" },
                                Promotion = null
                            }
                        }
                    },
                    new[]
                    {
                        new Hotel()
                        {
                            Name = "TEST_ID",
                            Country = new Country { Code = "Code", Name = "Name" },
                            Location = new Location { Code = "Code", Name = "Name" },
                            Resort = new Resort { Code = "Code", Name = "Name" }
                        }
                    }
                };

                yield return new object[] {
                    new AccommodationOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Code= "TEST_ID", Id = "TEST_ID_NEW" }
                            }
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                    },
                    new AccommodationOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Code= "TEST_ID", Id = "TEST_ID_NEW" }
                            }
                        }
                    },
                    new[]
                    {
                        new Hotel()
                        {
                            Name = "TEST_ID",
                            Country = new Country { Code = "Code", Name = "Name" },
                            Location = new Location { Code = "Code", Name = "Name" },
                            Resort = new Resort { Code = "Code", Name = "Name" }
                        }
                    }
                };
            }

            public static IEnumerable<object[]> SearchOffersResponse_ValidWithHotelTypes()
            {
                yield return new object[] {
                    new SearchOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Id = "TEST_ID" },
                                Hotel = new OfferHotel { HotelType = new ThemeType { Code = "adu" }}
                            }
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                    },
                    new SearchOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Id = "TEST_ID" },
                                Promotion = null
                            }
                        }
                    },
                    new[]
                    {
                        new Hotel()
                        {
                            Name = "TEST_ID",
                            Country = new Country { Code = "Code", Name = "Name" },
                            Location = new Location { Code = "Code", Name = "Name" },
                            Resort = new Resort { Code = "Code", Name = "Name" }
                        }
                    }
                };

                yield return new object[] {
                    new SearchOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Id = "TEST_ID_NEW" },
                            }
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                    },
                    new SearchOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Id = "TEST_ID_NEW" },
                            }
                        }
                    },
                    new[]
                    {
                        new Hotel()
                        {
                            Name = "TEST_ID",
                        }
                    }
                };
            }

            public static IEnumerable<object[]> SearchOffersResponse_Valid()
            {
                yield return new object[] {
                    new SearchOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Id = "TEST_ID" }
                            }
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                    },
                    new SearchOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Id = "TEST_ID" },
                                Promotion = null
                            }
                        }
                    },
                    new[]
                    {
                        new Hotel()
                        {
                            Name = "TEST_ID",
                            Country = new Country { Code = "Code", Name = "Name" },
                            Location = new Location { Code = "Code", Name = "Name" },
                            Resort = new Resort { Code = "Code", Name = "Name" }
                        }
                    }
                };

                yield return new object[] {
                    new SearchOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Id = "TEST_ID_NEW" }
                            }
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                    },
                    new SearchOffersResponse()
                    {
                        Offers = new List<Offer>()
                        {
                            new Offer()
                            {
                                Accom = new Accom() { Id = "TEST_ID_NEW" },
                            }
                        }
                    },
                    new[]
                    {
                        new Hotel()
                        {
                            Name = "TEST_ID",
                        }
                    }
                };
            }

            public static IEnumerable<object[]> LivePrice_Valid()
            {
                yield return new object[] {
                    new[]
                    {
                        new LivePriceSummaryModel()
                        {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "TEST_ID",
                            AccomCode = "TEST_CODE",
                            SearchCriteria = new(){ Adults = 2, Children = 2, Infants = 2 }
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                        {
                            Body =
                            [
                                new PromotionCmsModel
                                {
                                    Id = "TEST_ID",
                                    PromotionCodes = [new PromotionCodeCmsModel()],
                                    ValidationRules = new ValidationRules()
                                }
                            ]
                        },
                    },
                    new[]
                    {
                        new LivePriceSummaryModel()
                        {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "TEST_ID",
                            AccomCode = "TEST_CODE",
                            SearchCriteria = new(){ Adults = 2, Children = 2, Infants = 2 },
                            Promotion = new()
                            {
                                PromotionCodeTiers = new List<PromotionCodeTier>()
                                {
                                    new()
                                }
                            }
                        }
                    },
                    new[]
                    {
                        new Hotel()
                        {
                            Name = "TEST_ID",
                            Code = "TEST_CODE",
                            Country = new(){ Code = "TEST_COUNTRY_CODE", Name = "TEST_COUNTRY" },
                            Location = new(){ Code = "TEST_LOCATION_CODE", Name = "TEST_LOCATION" },
                            Resort = new(){ Code = "TEST_RESORT_CODE", Name = "TEST_RESORT" },
                            FacilityMatrix = []
                        }
                    },
                    new ThemeType(){Code = "THEME_CODE"},
                };
            }
            
            public static IEnumerable<object[]> LivePrice_Valid_MorePromotions()
            {
                yield return new object[] {
                    new[]
                    {
                        new LivePriceSummaryModel()
                        {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "TEST_ID",
                            AccomCode = "TEST_CODE",
                            SearchCriteria = new(){ Adults = 2, Children = 2, Infants = 2 }
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                        {
                            Body =
                            [
                                new PromotionCmsModel
                                {
                                    Id = "TEST_ID",
                                    PromotionCodes = [
                                        new PromotionCodeCmsModel() { Id = "TestId" },
                                    ],
                                    ValidationRules = new ValidationRules()
                                },
                                new PromotionCmsModel
                                {
                                    Id = "TEST_ID_2",
                                    PromotionCodes = [
                                        new PromotionCodeCmsModel() { Id = "TestId2" },
                                    ],
                                    ValidationRules = new ValidationRules()
                                }
                            ]
                        },
                    },
                    new[]
                    {
                        new LivePriceSummaryModel()
                        {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "TEST_ID",
                            AccomCode = "TEST_CODE",
                            SearchCriteria = new(){ Adults = 2, Children = 2, Infants = 2 },
                            Promotion = new()
                            {
                                PromotionCodeTiers = new List<PromotionCodeTier>()
                                {
                                    new()
                                }
                            }
                        }
                    },
                    new[]
                    {
                        new Hotel()
                        {
                            Name = "TEST_ID",
                            Code = "TEST_CODE",
                            Country = new(){ Code = "TEST_COUNTRY_CODE", Name = "TEST_COUNTRY" },
                            Location = new(){ Code = "TEST_LOCATION_CODE", Name = "TEST_LOCATION" },
                            Resort = new(){ Code = "TEST_RESORT_CODE", Name = "TEST_RESORT" },
                            FacilityMatrix = []
                        }
                    },
                    new ThemeType(){Code = "THEME_CODE"},
                };
            }
            
            public static IEnumerable<object[]> LivePrice_PromotionNotValid()
            {
                yield return new object[] {
                    new[]
                    {
                        new LivePriceSummaryModel()
                        {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "TEST_ID",
                            AccomCode = "TEST_CODE",
                            SearchCriteria = new(){ Adults = 2, Children = 2, Infants = 2 }
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                        {
                            Body =
                            [
                                new PromotionCmsModel
                                {
                                    PromotionCodes = [new PromotionCodeCmsModel()],
                                    ValidationRules = new ValidationRules()
                                    {
                                        HotelTypes = new ValidationRule<List<DatasourceObject>>()
                                        {
                                            Criteria = new List<DatasourceObject>()
                                            {
                                                new DatasourceObject()
                                                {
                                                    Code = "TEST_ID_NEW",
                                                    Name = "TEST_ID_NEW",
                                                    Type = "test_id"
                                                }
                                            },
                                            ValidationResult = new ValidationResult()
                                            {
                                                Code = "test",
                                                Message = "test"
                                            }
                                        }
                                    }
                                }
                            ]
                        },
                    },
                    new[]
                    {
                        new LivePriceSummaryModel()
                        {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "TEST_ID",
                            AccomCode = "TEST_CODE",
                            SearchCriteria = new(){ Adults = 2, Children = 2, Infants = 2 },
                            Promotion = new()
                        }
                    },
                    new[]
                    {
                        new Hotel()
                        {
                            Name = "TEST_ID",
                            Code = "TEST_CODE",
                            Country = new(){ Code = "TEST_COUNTRY_CODE", Name = "TEST_COUNTRY" },
                            Location = new(){ Code = "TEST_LOCATION_CODE", Name = "TEST_LOCATION" },
                            Resort = new(){ Code = "TEST_RESORT_CODE", Name = "TEST_RESORT" },
                            FacilityMatrix = []
                        }
                    },
                    new ThemeType(){Code = "THEME_CODE"},
                };
            }
            
            public static IEnumerable<object[]> LivePrice_PromotionCodeNotValid()
            {
                yield return new object[] {
                    new[]
                    {
                        new LivePriceSummaryModel()
                        {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "TEST_ID",
                            AccomCode = "TEST_CODE",
                            SearchCriteria = new(){ Adults = 2, Children = 2, Infants = 2 },
                            Price = 1000,
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                        {
                            Body =
                            [
                                new PromotionCmsModel
                                {
                                    PromotionCodes = [new PromotionCodeCmsModel()
                                    {
                                        ValidationRules =  new PromotionCodeValidationRules()
                                        {
                                            TotalPrice = new ValidationRule<decimal?>()
                                            {
                                                Criteria = 500000,
                                                ValidationResult = new ValidationResult()
                                                {
                                                    Code = "test",
                                                    Message = "test"
                                                }
                                            }
                                        }
                                    }],
                                    ValidationRules = new ValidationRules()
                                }
                            ]
                        },
                    },
                    new[]
                    {
                        new LivePriceSummaryModel()
                        {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "TEST_ID",
                            AccomCode = "TEST_CODE",
                            SearchCriteria = new(){ Adults = 2, Children = 2, Infants = 2 },
                            Promotion = new()
                        }
                    },
                    new[]
                    {
                        new Hotel()
                        {
                            Name = "TEST_ID",
                            Code = "TEST_CODE",
                            Country = new(){ Code = "TEST_COUNTRY_CODE", Name = "TEST_COUNTRY" },
                            Location = new(){ Code = "TEST_LOCATION_CODE", Name = "TEST_LOCATION" },
                            Resort = new(){ Code = "TEST_RESORT_CODE", Name = "TEST_RESORT" },
                            FacilityMatrix = []
                        }
                    },
                    new ThemeType(){Code = "THEME_CODE"},
                };
            }

            public static IEnumerable<object[]> GetPromocodeDiscountsForOffers_Valid()
            {
                yield return new object[] {
                    new MatchPromocodesRequestBase()
                    {
                        VoucherCode = "code",
                        ValidateBookingRequests = new List<AlternativeFlightOffer>()
                        {
                            new AlternativeFlightOffer()
                            {
                            Id = "1",
                            Accom = new Accom()
                            {
                                Code = "testCode",
                                Id = "testCode",
                                Unit = null,
                                IsExternal = false,
                                Date = new DateTime(2022, 01, 01),
                                Stay = 7,
                                Prom = null,
                                PackageId = ""
                            },
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                            {
                                                new Route
                                                {
                                                    Id = "reouteId"
                                                },
                                                new Route
                                                {
                                                    Id = "reouteId2"
                                                }
                                            }
                            },
                            Transfers = new List<TransferItem>
                                    {
                                        new TransferItem
                                        {
                                            Code = "TestSS"
                                        }
                            }
                            }
                        }
                    },
                    new MatchPromocodesResponse()
                    {
                        Payload = new JsonApiPayload<PromocodeDiscount>()
                        {
                            Body = new PromocodeDiscount
                            {
                                PromocodeDiscounts = new Dictionary<string, PromocodeDiscounts>
                                {
                                    { "1", new PromocodeDiscounts { DiscountAmountPerBooking = 10 } }
                                }
                            }
                        }
                    },
                    new PromocodeDiscount
                        {
                            PromocodeDiscounts = new Dictionary<string, PromocodeDiscounts>
                            {
                                { "1", new PromocodeDiscounts { DiscountAmountPerBooking = 10 } }
                            }
                        }
                };
            }

            public static IEnumerable<object[]> GetPromocodeDiscountsForOffers_Invalid()
            {
                yield return new object[] {
                    new MatchPromocodesRequestBase()
                    {
                        VoucherCode = "code",
                        ValidateBookingRequests = new List<AlternativeFlightOffer>()
                        {
                            new AlternativeFlightOffer()
                            {
                                Id = "1",
                                Accom = new Accom()
                                {
                                    Code = "testCode",
                                    Id = "testCode",
                                    Unit = null,
                                    IsExternal = false,
                                    Date = new DateTime(2022, 01, 01),
                                    Stay = 7,
                                    Prom = null,
                                    PackageId = ""
                                },
                                Transport = new Transport
                                {
                                    Routes = new List<Route>
                                    {
                                        new Route
                                        {
                                            Id = "reouteId"
                                        },
                                        new Route
                                        {
                                            Id = "reouteId2"
                                        }
                                    }
                                },
                                Transfers = new List<TransferItem>
                                {
                                    new TransferItem
                                    {
                                        Code = "TestSS"
                                    }
                                }
                            }
                        }
                    }
                };
            }

            public static IEnumerable<object[]> ValidateBookingResponse_Valid()
            {
                yield return new object[]
                {
                    new ValidateBookingRequest()
                    {
                        Offer = new Offer()
                        {
                            Accom = new Accom() { Code = "TEST_ID", Id = "TEST_ID" },
                            Hotel = new OfferHotel()
                            {
                                Country = new HotelCountry(),
                                Location =  new HotelLocation(),
                                Resort = new HotelResort(),
                            }
                        }
                    },
                    new GetAllPromotionsResponse() { Payload = new JsonApiPayload<List<PromotionCmsModel>>() },
                    new ValidateBookingResponse() { Promotion = null, PaymentInfo = new PriceInfo() }
                };
            }
            
            public static IEnumerable<object[]> ValidateBookingResponse_HasPromotions()
            {
                yield return new object[]
                {
                    new ValidateBookingRequest()
                    {
                        Offer = new Offer()
                        {
                            Accom = new Accom() { Code = "TEST_ID", Id = "TEST_ID" },
                            Hotel = new OfferHotel()
                            {
                                Country = new HotelCountry(),
                                Location =  new HotelLocation(),
                                Resort = new HotelResort(),
                            }
                        }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                        {
                            Body =
                            [
                                new PromotionCmsModel
                                {
                                    Id = "TEST_ID",
                                    PromotionCodes = [
                                        new PromotionCodeCmsModel() { Id = "TestId" },
                                    ],
                                    ValidationRules = new ValidationRules()
                                },
                                new PromotionCmsModel
                                {
                                    Id = "TEST_ID_NEW",
                                    PromotionCodes = [
                                        new PromotionCodeCmsModel() { Id = "TestId2" },
                                    ],
                                    ValidationRules = new ValidationRules()
                                }
                            ]
                        },
                    },
                    new ValidateBookingResponse() {
                        Promotion = new SinglePromotionInfo()
                        {
                            PromotionCodeTiers = new List<PromotionCodeTier>()
                            {
                                new PromotionCodeTier()
                            }
                        },
                        PaymentInfo =  new PriceInfo(),
                    }
                };
            }
            
            public static IEnumerable<object[]> ValidateBookingResponse_IsNull()
            {
                yield return new object[]
                {
                    new ValidateBookingRequest()
                    {
                        Offer = new Offer() { Accom = new Accom() { Code = "TEST_ID", Id = "TEST_ID" }, }
                    },
                    new GetAllPromotionsResponse()
                    {
                        Payload = new JsonApiPayload<List<PromotionCmsModel>>()
                        {
                            Body =
                            [
                                new PromotionCmsModel
                                {
                                    PromotionCodes = [
                                        new PromotionCodeCmsModel() { Id = "TestId" },
                                    ],
                                    ValidationRules = new ValidationRules()
                                },
                                new PromotionCmsModel
                                {
                                    PromotionCodes = [
                                        new PromotionCodeCmsModel() { Id = "TestId2" },
                                    ],
                                    ValidationRules = new ValidationRules()
                                }
                            ]
                        },
                    },
                    null
                };
            }

            public static IEnumerable<object[]> ValidateBookingRequest_IsNull()
            {
                yield return new object[]
                {
                    new ValidateBookingResponse()
                    {
                        PaymentInfo = new PriceInfo()
                    }
                };
            }
        }
    }
}
