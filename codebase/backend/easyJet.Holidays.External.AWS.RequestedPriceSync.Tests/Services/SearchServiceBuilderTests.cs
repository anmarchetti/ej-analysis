using Amazon.Lambda.Core;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Services;
using easyJet.Holidays.External.Domain.Api;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Tests.Services;
public class SearchServiceBuilderTests
{
    private readonly SearchServiceBuilder _sut;
    private readonly Mock<ISettingsService> _settingsService = new();
    private readonly Mock<ICacheService> _cacheService = new();
    private readonly Mock<IAWSDbRepository<RegionWeather>> _weatherDatRepository = new();
    private readonly Mock<IReferenceDataService> _referenceDataService = new();
    private readonly Mock<IPromotionCollectionsService> _promotionCollectionsService = new();
    private readonly Mock<IDestinationsService> _destinationService = new();
    private readonly Mock<IHotelsService> _hotelsService = new();
    private readonly EndpointsProvider _endpointsProvider;
    private readonly Mock<IApiService> _apiService = new();
    private readonly Mock<IHotelThemeService> _hotelThemeService = new();
    private readonly Mock<ILambdaLogger> _logger = new();
    private readonly Mock<ICookiesService> _cookiesService = new();
    private readonly Mock<ILogger<EndpointsProvider>> _endpointsProviderLogger = new();


    public SearchServiceBuilderTests()
    {
        var atcomSettings = Options.Create(new AtcomSettings
        {
            Search = new()
            {
                Uk = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchuk",
                },
                Ch = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchch",
                },
                De = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchde",
                },
                Fr = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchfr",
                }
            },
            Booking = new AtcomApiSettings
            {
                Host = "https://ezy-tst-vrp.atcoretec.com",
                BaseUrl = "/test"
            }
        });
        var cacheSettings = Options.Create(new CacheSettings());
        var envSettings = Options.Create(new EnvironmentBehaviourSettings
        {
            Performance = new PerformanceSettings { UseDisposableHttpClient = false }
        });
        var languageSettings = Options.Create(new LanguageSettings
        {
            MarketMasterLanguageMap = new Dictionary<string, string> { { "UK", "en" } }
        });
        var searchSettings = Options.Create(new SearchSettings());
        var cmsSettings = Options.Create(new CmsSettings());
        var apiSettings = Options.Create(new ApiSettings());
        var smartSeerSettings = Options.Create(new SmartSeerSettings());

        _endpointsProvider = new EndpointsProvider(atcomSettings, envSettings, _cookiesService.Object, _endpointsProviderLogger.Object);

        _sut = new SearchServiceBuilder(
        _settingsService.Object,
        _cacheService.Object,
        atcomSettings,
        cacheSettings,
        envSettings,
        languageSettings,
        searchSettings,
        cmsSettings,
        apiSettings,
        _weatherDatRepository.Object,
        smartSeerSettings);
    }

    [Fact]
    public void Build_NoCachedService_ReturnsNewService()
    {
        var service = _sut.Build(
            "UK",
            _referenceDataService.Object,
            _destinationService.Object,
            _hotelsService.Object,
            _endpointsProvider,
            _apiService.Object,
            _hotelThemeService.Object,
            _logger.Object,
            _promotionCollectionsService.Object);

        service.Should().NotBeNull();
    }

    [Fact]
    public void Build_HasCachedService_ReturnsSameService()
    {
        var service = _sut.Build(
            "UK",
            _referenceDataService.Object,
            _destinationService.Object,
            _hotelsService.Object,
            _endpointsProvider,
            _apiService.Object,
            _hotelThemeService.Object,
            _logger.Object,
            _promotionCollectionsService.Object);

        var nextService = _sut.Build(
            "UK",
            _referenceDataService.Object,
            _destinationService.Object,
            _hotelsService.Object,
            _endpointsProvider,
            _apiService.Object,
            _hotelThemeService.Object,
            _logger.Object,
            _promotionCollectionsService.Object);

        service.Should().NotBeNull();
        nextService.Should().NotBeNull();
        nextService.Should().Be(service);
    }
}