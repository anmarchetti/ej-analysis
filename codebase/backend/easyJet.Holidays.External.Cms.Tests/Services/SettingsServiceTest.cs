using AutoFixture;
using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Models.Destinations;
using easyJet.Holidays.External.Cms.Models.Settings;
using easyJet.Holidays.External.Cms.Models.ItemByPath;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Cms.Tests.Services
{
    public class SettingsServiceTest
    {
        private IFixture _fixture;
        private IOptions<CacheSettings> _cacheSettings;
        private IOptions<CmsSettings> _cmsSettings;
        private IOptions<LanguageSettings> _languageSettings;
        private IOptions<AtcomSettings> _atcomSettings;

        public SettingsServiceTest()
        {
            _cacheSettings = Options.Create(new CacheSettings
            {
                Buckets = new Buckets
                {
                    SearchCache = "SearchCache",
                    PriceBreakdown = "PriceBreakdown",
                    CancelAndCreditSettings = "CancelAndCreditSettings",
                    CmsSessionSettings = "CmsSessionSettings",
                    CMSReferenceData = "CMSReferenceData",
                    MarketSettings = "MarketSettings"
                }
            });

            _cmsSettings = Options.Create(new CmsSettings
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings
                {
                    Content = "api/content",
                    PriceBreakdownSetting = "api/price-breakdown",
                    CancelAndCreditSettings = "api/cancel-credit",
                    GetPromoCacheBustingSetting = "api/promo-cache-busting",
                    GetAllMarketSettings = "api/market-settings"
                },
                ContentPath = new ContentPath
                {
                    LockedAccountSettings = "PathToLockedAccountSettings",
                    SessionSettings = "PathToSessionSettings",
                    SeatMapSettings = "PathToSeatMapSettings"
                }
            });

            _languageSettings = Options.Create(new LanguageSettings
            {
                MarketMasterLanguageMap = new Dictionary<string, string>
                {
                    {"UK", "en" },
                    {"CH", "fr-CH" },
                }
            });

            _atcomSettings = Options.Create(new AtcomSettings
            {
                MarketBrands = new ()
                {
                    { "defaults", new() { Brands = new() { { "UK", "" } } } },
                    { "fph", new() { Brands = new() { { "UK", "" } } } }
                }
            });
        }

        [Theory, AutoMoqData]
        public async Task GetPromoCacheBustingSetting_ReturnSetting_IfReceivedFromCms(
            [Frozen] Mock<ICacheService> cacheService,
            PromoCacheBustingSetting promoCacheBustingSetting
            )
        {
            //Arrange
            cacheService.Setup(service =>
                    service.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<PromoCacheBustingSetting>>>(), false))
                .ReturnsAsync(promoCacheBustingSetting);

            var settingsService = new SettingsService(null, null, null, cacheService.Object, _cacheSettings, null, _cmsSettings, null, _languageSettings, _atcomSettings);

            //Act
            var actual = await settingsService.GetPromoCacheBustingSetting();

            //Assert
            actual.Should().NotBeNull();
            actual.QueryValue.Should().NotBeNullOrEmpty();
            actual.QueryValue.Should().BeEquivalentTo(promoCacheBustingSetting.QueryValue);
        }


        [Theory, AutoMoqData]
        public async Task GetPromoCacheBustingSetting_ReturnNotNullSettingWithNullValue_IfNotReceivedFromCms(
            [Frozen] Mock<ICacheService> cacheService,
            [Frozen] Mock<ILogger<SettingsService>> logger
        )
        {
            //Arrange
            cacheService.Setup(service =>
                    service.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<PromoCacheBustingSetting>>>(), false))
                .ReturnsAsync((PromoCacheBustingSetting)null);

            var settingsService = new SettingsService(null, null, null, cacheService.Object, _cacheSettings, logger.Object, _cmsSettings, null, _languageSettings, _atcomSettings);

            //Act
            var actual = await settingsService.GetPromoCacheBustingSetting();

            //Assert
            actual.Should().NotBeNull();
            actual.QueryValue.Should().BeNull();
        }

        [Theory, AutoMoqData]
        public async Task GetLockedAccountSetting_ReturnNotNullSetting(
            [Frozen] Mock<ICacheService> cacheService,
            [Frozen] Mock<IApiService> apiServiceMock,
            [Frozen] Mock<IHttpContextAccessor> httpContextAccessor
            )
        {
            //Arrange
            apiServiceMock
                .Setup(service =>
                    service.GetResponseContentAsync<ItemByPathRequest, ItemByPathResponse<LockedAccountSettings>>(It.IsAny<ItemByPathRequest>()))
                .ReturnsAsync(new ItemByPathResponse<LockedAccountSettings>()
                {
                    Payload = new JsonApiPayload<LockedAccountSettings>()
                    {
                        Body = new LockedAccountSettings() { EmailsString = "test@email.com" }
                    }
                });

            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings
                {
                    Content = "api/content",
                },
            });
            var loggerMock = new Mock<ILogger<BaseEndpointsProvider>>();

            // Act
            var sut = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, loggerMock.Object);

            var settingsService = new SettingsService(apiServiceMock.Object, sut, httpContextAccessor.Object, cacheService.Object, _cacheSettings, null, _cmsSettings, null, _languageSettings, _atcomSettings);

            //Act
            var actual = await settingsService.GetLockedAccountSetting();

            //Assert
            actual.EmailsString.Should().Be("test@email.com");
        }

        [Theory, AutoMoqData]
        public async Task GetAllMarketSettings_ReturnSetting_IfReceivedFromCms([Frozen] Mock<ICacheService> cacheService)
        {
            //Arrange
            cacheService.Setup(service =>
                    service.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<Dictionary<string, MarketSettings>>>>(), false))
                .ReturnsAsync(new Dictionary<string, MarketSettings>
                {
                    {
                        "en", new MarketSettings
                        {
                            Code = "UK"
                        }
                    }
                });

            var settingsService = new SettingsService(null, null, null, cacheService.Object, _cacheSettings, null, _cmsSettings, null, _languageSettings, _atcomSettings);

            //Act
            var actual = await settingsService.GetAllMarketSettings();

            //Assert
            actual.Should().NotBeNull();
            actual.Count.Should().BeGreaterThan(0);
            actual.Count.Should().Be(1);
        }


        [Theory, AutoMoqData]
        public async Task GetAllMarketSettings_ReturnNotNullSettingWithNullValue_IfNotReceivedFromCms(
            [Frozen] Mock<ICacheService> cacheService,
            [Frozen] Mock<ILogger<SettingsService>> logger
        )
        {
            //Arrange
            cacheService.Setup(service =>
                    service.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<Dictionary<string, MarketSettings>>>>(), false))
                .ReturnsAsync((Dictionary<string, MarketSettings>)null);

            var settingsService = new SettingsService(null, null, null, cacheService.Object, _cacheSettings, logger.Object, _cmsSettings, null, _languageSettings, _atcomSettings);

            //Act
            var actual = await settingsService.GetAllMarketSettings();

            //Assert
            actual.Should().NotBeNull();
            actual.Count.Should().Be(0);
        }

        [Theory, AutoMoqData]
        public async Task GetSessionSettings_PassesForceUpdateFlag(
            [Frozen] Mock<ICacheService> cacheService)
        {
            var expected = new SessionSettings { SessionTimeout = 10, TimerPopupTimeout = 5 };

            cacheService
                .Setup(service => service.GetOrAddAsync(
                    It.IsAny<string>(),
                    It.IsAny<ICollection<string>>(),
                    It.IsAny<Func<Task<SessionSettings>>>(),
                    true))
                .ReturnsAsync(expected);

            var settingsService = new SettingsService(null, null, null, cacheService.Object, _cacheSettings, null, _cmsSettings, null, _languageSettings, _atcomSettings);

            var actual = await settingsService.GetSessionSettings(true);

            actual.Should().BeEquivalentTo(expected);
        }

        [Theory, AutoMoqData]
        public async Task GetPriceBreakdownSettings_ReturnsEmpty_WhenCacheValueIsNull(
            [Frozen] Mock<ICacheService> cacheService,
            [Frozen] Mock<ILanguageService> languageService,
            [Frozen] Mock<ILogger<SettingsService>> logger)
        {
            languageService.Setup(x => x.GetCurrentLanguage()).Returns("en");
            cacheService.Setup(service =>
                    service.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<PriceBreakdownResponse>>>(), false))
                .ReturnsAsync((PriceBreakdownResponse)null);

            var settingsService = new SettingsService(null, null, null, cacheService.Object, _cacheSettings, logger.Object, _cmsSettings, languageService.Object, _languageSettings, _atcomSettings);

            var actual = await settingsService.GetPriceBreakdownSettings();

            actual.Should().NotBeNull();
            actual.PriceCategories.Should().BeNull();
        }

        [Theory, AutoMoqData]
        public async Task GetCancelCreditSettings_Throws_WhenCmsCallFails(
            [Frozen] Mock<ICacheService> cacheService,
            [Frozen] Mock<IApiService> apiServiceMock,
            [Frozen] Mock<IHttpContextAccessor> httpContextAccessor,
            [Frozen] Mock<ILogger<SettingsService>> logger)
        {
            var context = new DefaultHttpContext();
            httpContextAccessor.SetupGet(x => x.HttpContext).Returns(context);

            cacheService
                .Setup(service => service.GetOrAddAsync(
                    It.IsAny<string>(),
                    It.IsAny<ICollection<string>>(),
                    It.IsAny<Func<Task<CreditAndCashRefundSettings>>>(),
                    false))
                .Returns<string, ICollection<string>, Func<Task<CreditAndCashRefundSettings>>, bool>((_, _, getData, _) => getData());

            apiServiceMock
                .Setup(service => service.GetResponseContentAsync<EligibleForCancelCreditSettingsRequest, EligibleForCancelCreditSettingsResponse>(
                    It.IsAny<EligibleForCancelCreditSettingsRequest>()))
                .ThrowsAsync(new Exception("sitecore unavailable"));

            var loggerMock = new Mock<ILogger<BaseEndpointsProvider>>();
            var endpointsProvider = new EndpointsProvider(_cmsSettings, Options.Create(new EnvironmentBehaviourSettings()), null, loggerMock.Object);
            var settingsService = new SettingsService(apiServiceMock.Object, endpointsProvider, httpContextAccessor.Object, cacheService.Object, _cacheSettings, logger.Object, _cmsSettings, null, _languageSettings, _atcomSettings);

            await Assert.ThrowsAsync<Exception>(() => settingsService.GetCancelCreditSettings());
        }

        [Theory, AutoMoqData]
        public async Task GetSeatMapSettings_ReturnsSettingsFromCms(
            [Frozen] Mock<ICacheService> cacheService,
            [Frozen] Mock<IApiService> apiServiceMock,
            [Frozen] Mock<IHttpContextAccessor> httpContextAccessor)
        {
            var context = new DefaultHttpContext();
            httpContextAccessor.SetupGet(x => x.HttpContext).Returns(context);

            var expected = new SeatMapSettings
            {
                EnableSeatMapFlow = true,
                EnableSeatMapDateChange = false,
                EnableSeatMapPostBookingFlow = true,
                MinNumberOfDaysToDeparture = 2,
                TimeDisplayBannerTapSelectedSeatToRemoveIt = 6
            };

            apiServiceMock
                .Setup(service =>
                    service.GetResponseContentAsync<ItemByPathRequest, ItemByPathResponse<SeatMapSettings>>(It.IsAny<ItemByPathRequest>()))
                .ReturnsAsync(new ItemByPathResponse<SeatMapSettings>
                {
                    Payload = new JsonApiPayload<SeatMapSettings> { Body = expected }
                });

            var loggerMock = new Mock<ILogger<BaseEndpointsProvider>>();
            var endpointsProvider = new EndpointsProvider(_cmsSettings, Options.Create(new EnvironmentBehaviourSettings()), null, loggerMock.Object);
            var settingsService = new SettingsService(apiServiceMock.Object, endpointsProvider, httpContextAccessor.Object, cacheService.Object, _cacheSettings, null, _cmsSettings, null, _languageSettings, _atcomSettings);

            var actual = await settingsService.GetSeatMapSettings();

            actual.Should().BeEquivalentTo(expected);
        }

        [Theory, AutoMoqData]
        public async Task GetAllMarketSettings_ReturnsFPHSpecificBrand_WhenConfigured(
            [Frozen] Mock<ICacheService> cacheService)
        {
            _atcomSettings = Options.Create(new AtcomSettings
            {
                MarketBrands = new()
                {
                    { "defaults", new() { Brands = new() { { "UK", "DEFAULT_BRAND" } } } },
                    { "fph", new() { Brands = new() { { "UK", "FPH_BRAND" } } } }
                }
            });

            cacheService.Setup(service =>
                    service.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<Dictionary<string, MarketSettings>>>>(), false))
                .ReturnsAsync(new Dictionary<string, MarketSettings>
                {
                    {
                        "en", new MarketSettings
                        {
                            Code = "UK"
                        }
                    }
                });

            var settingsService = new SettingsService(null, null, null, cacheService.Object, _cacheSettings, null, _cmsSettings, null, _languageSettings, _atcomSettings);

            var actual = await settingsService.GetAllMarketSettings();

            actual["UK"].AtcomBrandCode.Should().Be("DEFAULT_BRAND");
            actual["UK"].FPHAtcomBrandCode.Should().Be("FPH_BRAND");
        }
    }
}