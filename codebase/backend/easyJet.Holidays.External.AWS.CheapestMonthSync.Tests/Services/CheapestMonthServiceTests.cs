using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Services;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Services.Interfaces;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Settings;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.CheapestMonthSync.Tests.Services;
public class CheapestMonthServiceTests
{
    private Mock<IAtcomRequestParamBuilder> _atcomRequestParamBuilderMock;
    private CheapestMonthService _cheapestMonthService;

    private readonly Mock<IApiService> _apiService = new();
    private readonly Mock<ICacheService> _cacheService = new();
    private readonly IOptions<AtcomSettings> _atcomSettings;
    private readonly IOptions<CacheSettings> _cacheSettings;
    private readonly Mock<ISettingsService> _settingsService = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
    private readonly Mock<IMarketService> _marketService = new();
    private readonly Mock<ILogger<SearchOffersService>> _logger = new();
    private readonly Mock<IReferenceDataService> _referenceDataService = new();
    private readonly Mock<IBoardService> _boardService = new();
    private readonly SearchOffersService searchOfferService;

    private readonly IFixture _fixture;
    private readonly AvCacheResultOffersOffer _cheapestOffer;

    public CheapestMonthServiceTests()
    {
        _atcomSettings = Options.Create(new AtcomSettings
        {
            Booking = new AtcomApiSettings
            {
                Host = "http://localhost",
                BaseUrl = "/b"
            },
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
            EndpointTemplate = new AtcomEndpointTemplateSettings
            {
                SearchRoomVariants = "search_rooms_tmpl&{0}",
                BrandParam = "brnd={0}"
            },
            Transfers = new TransfersSettings()
        });

        _cacheSettings = Options.Create(new CacheSettings());

        _fixture = FixtureUtils.AutoMoqFixture();
        _fixture.Inject(_atcomSettings);

        searchOfferService = new SearchOffersService(
            _boardService.Object,
            _apiService.Object,
            _fixture.Create<EndpointsProvider>(),
            _fixture.Create<SearchRequestsMapper>(),
            _cacheService.Object,
            _atcomSettings,
            _cacheSettings,
            _settingsService.Object,
            _httpContextAccessor.Object,
            _marketService.Object,
            _logger.Object,
            _referenceDataService.Object);

        _cheapestOffer = new AvCacheResultOffersOffer { Price = 100 };
        SetupSearchResponse();

        _atcomRequestParamBuilderMock = new Mock<IAtcomRequestParamBuilder>();

        var lambdaSettings = new easyJet.Holidays.External.AWS.CheapestMonthSync.Settings.LambdaSettings { Language = "EN", Market = "UK", IsLastAvailableFilterOn = false, AtcomSearchType = new AtcomSearchType { Normal = "S", Report = "R" }, PromoPageId = Guid.NewGuid() };
        var lambdaOptions = Options.Create(lambdaSettings);

        _cheapestMonthService = new CheapestMonthService(
            _atcomRequestParamBuilderMock.Object,
            searchOfferService,
            new Mock<ILogger<CheapestMonthService>>().Object,
            lambdaOptions,
            _atcomSettings);
    }

    [Fact]
    public async Task FindCheapestMonth_SearchSelectionMessageIsNull_ArgumentNullExceptionThrown()
    {
        // Arrange
        DateTimeRange dateRangeChunk = new DateTimeRange(DateTime.Now, DateTime.Now.AddMonths(1));

        // Act & Assert
        await _cheapestMonthService
         .Awaiting(x => x.FindCheapestMonth(null, dateRangeChunk))
         .Should()
         .ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task FindCheapestMonth_DateRangeChunkIsNull_ArgumentNullExceptionThrown()
    {
        // Arrange
        SearchSelectionData searchSelectionMessage = new SearchSelectionData();

        // Act & Assert
        await _cheapestMonthService
            .Awaiting(x => x.FindCheapestMonth(searchSelectionMessage, null))
            .Should()
            .ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task FindCheapestMonth_ManyOffersReceived_CheapestOfferReturned()
    {
        // Arrange
        var searchSelectionMessage = new SearchSelectionData { AirportCode = "LGW" };
        var dateRangeChunk = new DateTimeRange(DateTime.Now, DateTime.Now.AddMonths(1));
       
        _atcomRequestParamBuilderMock.Setup(x => x.BuildGeographyParamValue(searchSelectionMessage))
            .Returns("geography");

        // Act
        var result = await _cheapestMonthService.FindCheapestMonth(searchSelectionMessage, dateRangeChunk);

        // Assert
        result.Should().NotBeNull();
        result!.Price.Should().Be(_cheapestOffer.Price);
    }

    private void SetupSearchResponse()
    {
        var secondOffer = new AvCacheResultOffersOffer { Price = _cheapestOffer.Price + 100 };

        var offers = new SearchAvailablePackagesResponse { 
            Payload = new External.Domain.Models.Api.Payload.XmlApiPayload<Atcom.Models.Internal.Search.AvCache> 
            { 
                Body = new Atcom.Models.Internal.Search.AvCache 
                { 
                    Result = new Atcom.Models.Internal.Search.AvCacheResult 
                    { 
                        Offers = new Atcom.Models.Internal.Search.AvCacheResultOffers 
                        { 
                            Count = 2, 
                            Offer = new[] { _cheapestOffer, secondOffer } 
                        } 
                    } 
                } 
            } 
        };
        _apiService
            .Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()))
            .ReturnsAsync(offers);
    }
}
