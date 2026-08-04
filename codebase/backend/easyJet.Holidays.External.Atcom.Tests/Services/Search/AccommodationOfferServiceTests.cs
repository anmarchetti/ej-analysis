using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.Hotel;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Mappers.Builders;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Extras;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using System.Collections.ObjectModel;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.Search;

public class AccommodationOfferServiceTests
{
    private const string REQUIRED_DATETIME_FORMAT = "yyyy-MM-dd";
    private AtcomSettings _atcomSettings = new AtcomSettings
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
            SearchRoomVariants = "s_tp=6&{0}",
            BrandParam = "brnd={0}",
        },
        Transfers = new TransfersSettings()
    };

    protected readonly IFixture _fixture;
    private readonly IOptions<SearchSettings> _searchSettings;
    private readonly Mock<SearchRequestsMapper> _searchRequestsMapper;
    private readonly Mock<IMarketService> _marketService;
    private readonly Mock<IHotelsService> _hotelsService;
    private readonly Mock<IBoardService> _boardService;
    protected readonly AccommodationOfferService _sut;
    protected readonly Mock<IApiService> _searchOffersApiServiceMock;
    protected readonly Mock<SearchOffersService> _searchOffersServiceMock;
    protected readonly Mock<IExtrasService> _extrasServiceMock;
    protected readonly Mock<IReferenceDataService> _referenceDataServiceMock;
    private readonly Mock<IHotelOfferService> _hotelOfferServiceMock;
    private readonly Mock<ITransferService> _transferServiceMock;
    private readonly Mock<IOffersMapper> _offersMapper;
    private readonly OffersMapper offersMapper;
    private readonly Mock<IOfferHotelMapper> _offerHotelMapper;
    private readonly Mock<IMarketService> _marketServiceMock;

    public AccommodationOfferServiceTests()
    {
        _fixture = FixtureUtils.AutoMoqFixture();
        _fixture.Inject(Options.Create(_atcomSettings));

            _searchOffersApiServiceMock = new Mock<IApiService>();
            _referenceDataServiceMock = new Mock<IReferenceDataService>();
            _hotelOfferServiceMock = new Mock<IHotelOfferService>();
            _transferServiceMock = new Mock<ITransferService>();
            _marketServiceMock = new();
            _boardService = _fixture.Create<Mock<IBoardService>>();

        _searchOffersServiceMock = new Mock<SearchOffersService>(
            _boardService.Object,
            _searchOffersApiServiceMock.Object,
            _fixture.Create<EndpointsProvider>(),
            _fixture.Create<SearchRequestsMapper>(),
            _fixture.Create<ICacheService>(),
            _fixture.Create<IOptions<AtcomSettings>>(),
            _fixture.Create<IOptions<CacheSettings>>(),
            _fixture.Create<ISettingsService>(),
            _fixture.Create<IHttpContextAccessor>(),
            _fixture.Create<IMarketService>(),
            _fixture.Create<ILogger<SearchOffersService>>(),
            _referenceDataServiceMock.Object
        );
        _extrasServiceMock = new Mock<IExtrasService>();

        var atcomSettings = _fixture.Create<IOptions<AtcomSettings>>();
        atcomSettings.Value.RoomSystemsSettings = new RoomSystemsSettings
        {
            Priorities = new Dictionary<string, int>
            {
                {"TGX", 0},
                {"Static", 1}
            },
            SystemToDiscard = "HB3"
        };
        atcomSettings.Value.Transfers = new TransfersSettings
        {
            Types = new TransferTypesSettings
            {
                SyntheticNoTransfer = "DEFAULT"
            }
        };

        var hotelThemeService = new HotelThemeService(_referenceDataServiceMock.Object, Options.Create(new CmsSettings()));
        var pricesService = new PricesService(Options.Create(new ApiSettings()));
        _offersMapper = new Mock<IOffersMapper>();
        offersMapper = new OffersMapper(_referenceDataServiceMock.Object, hotelThemeService, atcomSettings, pricesService);
        _offerHotelMapper = new Mock<IOfferHotelMapper>();
        var airportsMapper = new AirportsMapper(_referenceDataServiceMock.Object);
        _searchSettings = Options.Create(new SearchSettings { PriceGraphRange = 7, MaximumPriceGraphDaysToReturn = 100, MaximumPriceGraphDate = 240 });
        _searchRequestsMapper = _fixture.Create<Mock<SearchRequestsMapper>>();
        _marketService = _fixture.Create<Mock<IMarketService>>();
        _hotelsService = _fixture.Create<Mock<IHotelsService>>();

        _sut = new AccommodationOfferService(
            atcomSettings,
            _hotelsService.Object,
            _searchRequestsMapper.Object,
            _hotelOfferServiceMock.Object,
            _searchSettings,
            _fixture.Create<ILogger<AccommodationOfferService>>(),
            _transferServiceMock.Object,
            _searchOffersServiceMock.Object,
            _fixture.Create<IPromotionValidatorService>(),
            _fixture.Create<IOptions<ApiSettings>>(),
            _extrasServiceMock.Object,
            _marketService.Object,
            offersMapper,
            _offerHotelMapper.Object,
            airportsMapper,
            _fixture.Create<SearchAvailablePackagesFilterAndMapper>(),
            _boardService.Object
        );
    }

    [Fact]
    public async Task AccommodationOffer_TwoRooms_DoTwoSearchRequests()
    {
        // Arrange fixture
        IFixture _fixture = FixtureUtils.AutoMoqFixture();

        var atcomSettingsMock = _fixture.Freeze<Mock<IOptions<AtcomSettings>>>();
        atcomSettingsMock.Setup(x => x.Value).Returns(_atcomSettings);

        var apiService = _fixture.Freeze<Mock<IApiService>>();
        apiService
            .Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()))
            .ReturnsAsync(new SearchAvailablePackagesResponse
            {
                Payload = new Domain.Models.Api.Payload.XmlApiPayload<AvCache>
                {
                    Body = new AvCache
                    {
                        Result = new AvCacheResult
                        {
                            Offers = new AvCacheResultOffers
                            {
                                Offer = new AvCacheResultOffersOffer[0]
                            }
                        }
                    }
                }
            });

        // Arrange
        var request = new AccommodationOfferRequest
        {
            StartDate = "2019-01-01",
            Room = new List<RoomAllocation>
            {
                new RoomAllocation
                {
                    Adults=1,
                    RoomCode="1AB"
                },
                new RoomAllocation
                {
                    Adults=1,
                    Children=1,
                }
            }
        };

        var sut = _fixture.Create<AccommodationOfferService>();

        // Act
        var result = await sut.SearchAccommodationOffer(request);

        // Assert
        apiService
            .Verify(
            x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.Is<SearchAvailablePackagesRequest>(
                r => r.QueryParams.Contains("rooms=1")
                    && r.QueryParams.Contains("rm_1=1")
                    && r.QueryParams.Contains("rmtp_1=1AB")
                    && r.QueryParams.Contains("pax_ad=1")
                    && r.QueryParams.Contains("pax_ch=0")
            )),
            Times.Once
        );
        apiService
            .Verify(
            x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.Is<SearchAvailablePackagesRequest>(
                r => r.QueryParams.Contains("rooms=1")
                    && r.QueryParams.Contains("rm_1=1,2")
                    && r.QueryParams.Contains("pax_ad=1")
                    && r.QueryParams.Contains("pax_ch=1")
            )),
            Times.Once
        );
    }

    [Fact]
    public async Task AccommodationOffer_ValidData_UseRoomVariantsTemplate()
    {
        // Arrange fixture
        IFixture _fixture = FixtureUtils.AutoMoqFixture();

        var atcomSettingsMock = _fixture.Freeze<Mock<IOptions<AtcomSettings>>>();
        atcomSettingsMock.Setup(x => x.Value).Returns(_atcomSettings);

        var apiService = _fixture.Freeze<Mock<IApiService>>();
        apiService
            .Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()))
            .ReturnsAsync(new SearchAvailablePackagesResponse());

        // Arrange
        var request = new AccommodationOfferRequest
        {
            StartDate = "2019-01-01",
            Room = new List<RoomAllocation>
            {
                new RoomAllocation
                {
                    Adults=1,
                    RoomCode="1BA01"
                }
            }
        };

        _fixture.Register<IOffersMapper>(() => _fixture.Create<OffersMapper>());
        var sut = _fixture.Create<AccommodationOfferService>();

        // Act
        var result = await sut.SearchAccommodationOffer(request);

        // Assert
        apiService
            .Verify(
            x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.Is<SearchAvailablePackagesRequest>(
                r => r.QueryParams.StartsWith("s_tp=6&")
                    && r.QueryParams.Contains("&rooms=1")
                    && r.QueryParams.Contains("&rm_1=1")
            )),
            Times.Once
        );
    }

    [Fact]
    public async Task SearchAccommodationOffer_HandlesLateRoomCheckout()
    {
        // Arrange
        var request = new AccommodationOfferRequest
        {
            StartDate = DateTime.Now.AddDays(60).ToString(REQUIRED_DATETIME_FORMAT),
            LateRoomCheckout = true,
            Room = new List<RoomAllocation>
            {
                new RoomAllocation
                {
                    Adults = 1,
                }
            }
        };
        var list = new List<string>
        {
            "689740760",
            "2133484676",
            "1669733818",
        };

        _referenceDataServiceMock.Setup(x => x.GetAccommodationToGiataMappings(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(new Dictionary<string, string>
            {
                { list[0], "1357743204" },
                { list[1], "1775360239" },
                { list[2], "480458007" }
            });

        _searchOffersApiServiceMock
            .Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()))
            .ReturnsAsync(new SearchAvailablePackagesResponse
            {
                Payload = new Domain.Models.Api.Payload.XmlApiPayload<AvCache>
                {
                    Body = new AvCache
                    {
                        Result = new AvCacheResult
                        {
                            Offers = new AvCacheResultOffers
                            {
                                Count = 3,
                                CountSpecified = true,
                                // this appears to be required for the offers to be handled correctly
                                // just initializing the offers will NOT work.
                                Lists = new AvCacheResultOffersLists(),
                                Facets =
                                [
                                    new AvCacheResultOffersCat{ Code = "a", Facet = [new AvCacheResultOffersCatFacet()] },
                                    new AvCacheResultOffersCat{ Code = "b", Facet = [new AvCacheResultOffersCatFacet()] },
                                    new AvCacheResultOffersCat{ Code = "c", Facet = [new AvCacheResultOffersCatFacet()] },
                                ],
                                Offer =
                                [
                                    new AvCacheResultOffersOffer{ Accom = BuildDummyAccommodation(list[0]), Price = 100, PricePP = 100},
                                    new AvCacheResultOffersOffer{ Accom = BuildDummyAccommodation(list[1]), Price = 100, PricePP = 100},
                                    new AvCacheResultOffersOffer { Accom = BuildDummyAccommodation(list[2]), Price = 100, PricePP = 100},
                                ]
                            }
                        }
                    }
                }
            });

            _extrasServiceMock.Setup(x => x.Get(It.IsAny<Holidays.Api.Domain.Data.PackageOffers.Offer>())).ReturnsAsync(
                new OfferExtras
                {
                    LateRoomCheckout = new LateRoomCheckoutItem { Price = 100m },
                });

        // Act
        var result = await _sut.SearchAccommodationOffer(request);

            // Assert
            result.Should().NotBeNull();
            _extrasServiceMock.Verify(mock => mock.Get(It.IsAny<Holidays.Api.Domain.Data.PackageOffers.Offer>()), Times.Once);
        }

    /// <summary>
    /// required to pass the filter for rooms without adults, see <see cref="SearchOffersService.GetRidOfZeroAdults(SearchAvailablePackagesResponse)"/>
    /// </summary>
    /// <returns></returns>
    private static AvCacheResultOffersOfferAccom[] BuildDummyAccommodation(string accomCode)
    {
        return
        [
            new AvCacheResultOffersOfferAccom
            {
                Code = accomCode,
                Unit =
                [
                    new AvCacheResultOffersOfferAccomUnit
                    {
                        Occ = new AvCacheResultOffersOfferAccomUnitOcc
                        {
                            Ad = 100
                        }
                    }
                ]
            }
        ];
    }

    [Fact]
    public async Task PriceGraph_PriceGraphRequest_InvalidSearchDate_ThrowsApiException()
    {
        _searchSettings.Value.MaximumPriceGraphDate = 0;
        // Arrange
        var request = new PriceGraphRequest
        {
            StartDate = DateTime.Now.ToString(CultureInfo.InvariantCulture),
            InitialDate = DateTime.Now.AddDays(-1).ToString(CultureInfo.InvariantCulture),
        };

        // Act
        Func<Task<PriceGraphResponse>> action = async () => await _sut.PriceGraph(request);

        // Assert
        var exc = await Assert.ThrowsAsync<ApiException>(action);
    }

    [Fact]
    public async Task PriceGraph_IsCheapestRoom_ReturnsCheapestRoomOffers()
    {
        // Arrange
        var request = new PriceGraphRequest
        {
            StartDate = "2024-09-01",
            InitialDate = "2024-09-01",
            Departure = "BHX",
            AccommodationIds = "ESDO0029",
            BoardType = "BB",
            MarketCode = "GB",
            IsCheapestRoom = true,
            Duration = new List<int> { 7 },
            Room = new List<RoomAllocation> { new RoomAllocation { Adults = 1, RoomCode = "TW02" } }
        };

        PriceGraphBaseRequest capturedRequest = null;

        _searchRequestsMapper
            .Setup(srm => srm.MapPriceGraph(It.IsAny<PriceGraphBaseRequest>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Callback<PriceGraphBaseRequest, string, string, string>((req, _, _, _) => capturedRequest = req)
            .Returns(new SearchAvailablePackagesRequest())
            .Verifiable();

        _marketService.Setup(ms => ms.GetMarket(request.MarketCode))
            .Returns(new MarketSettings { Code = request.MarketCode })
            .Verifiable();

        _hotelsService.Setup(hs => hs.Search(It.IsAny<string[]>()))
            .ReturnsAsync([new Hotel { StarRating = "4" }])
            .Verifiable();

        _offerHotelMapper
            .Setup(ohm => ohm.EnrichBoardTypeAndRoomType(It.IsAny<Hotel>(), It.IsAny<Unit>(), It.IsAny<DateTime?>(), It.IsAny<int?>()))
            .Returns(Task.CompletedTask);

        SetSearchOffersResponse(
            new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 01, 0, 0, 0, DateTimeKind.Utc))
                .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                    .WithAccommadation(accomId: "ESDO0029")
                    .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "RO", adult: 1, children: 0, infant: 0)
                    .Build())
                .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                    .WithRoute(arrDate: "2024-09-08", depDate: "2024-09-01", arrTime: "2200", depTime: "2200", outboundRouteId: "OUT", inboundRouteId: "IN")
                    .Build())
                .Build());

        // Act
        var response = await _sut.PriceGraph(request);

        // Assert
        response.Should().NotBeNull();
        response.Offers.Should().Contain(offer =>
            offer.Date == new DateTime(2024, 09, 01, 0, 0, 0, DateTimeKind.Utc) &&
            offer.Board == "RO" &&
            offer.Price == 1800 &&
            offer.PricePP == 900 &&
            offer.AccommodationId == "ESDO0029");

        capturedRequest.Should().NotBeNull();
        capturedRequest!.BoardType.Should().BeNull();
        capturedRequest.Room.Should().OnlyContain(room => room.RoomCode == string.Empty);

        _searchRequestsMapper.Verify();
        _marketService.Verify();
        _hotelsService.Verify();
    }

    [Fact]
    public async Task PriceGraph_IsCheapestRoom_NoHotel_ReturnsDateOnlyOffers()
    {
        // Arrange
        var request = new PriceGraphRequest
        {
            StartDate = "2024-09-01",
            InitialDate = "2024-09-01",
            Departure = "BHX",
            AccommodationIds = "ESDO0029",
            BoardType = "BB",
            MarketCode = "GB",
            IsCheapestRoom = true,
            Duration = new List<int> { 7 },
            Room = new List<RoomAllocation> { new RoomAllocation { Adults = 1, RoomCode = "TW02" } }
        };

        _searchRequestsMapper
            .Setup(srm => srm.MapPriceGraph(It.IsAny<PriceGraphBaseRequest>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(new SearchAvailablePackagesRequest())
            .Verifiable();

        _marketService.Setup(ms => ms.GetMarket(request.MarketCode))
            .Returns(new MarketSettings { Code = request.MarketCode })
            .Verifiable();

        SetSearchOffersResponse();

        // Act
        var response = await _sut.PriceGraph(request);

        // Assert
        response.Should().NotBeNull();
        response.Offers.Should().HaveCount(15);
        response.Offers.Should().OnlyContain(offer => offer.Price == 0m && offer.PricePP == 0m && offer.Board == null);

        _searchRequestsMapper.Verify();
        _marketService.Verify();
        _hotelsService.Verify(hs => hs.Search(It.IsAny<string[]>()), Times.Never);
    }

    [Theory]
    [ClassData(typeof(PriceGraphClassDataExtactMatch))]
    public async Task PriceGraph_PriceGraphRequest_Returns(PriceGraphRequest priceGraphRequest,
        SearchAvailablePackagesRequest searchAvailablePackagesRequest,
        SearchAvailablePackagesResponse searchAvailablePackagesResponse,
        MarketSettings marketSettings,
        List<AvCacheResultOffersOffer> searchOffersResponse,
        Hotel hotel,
        PriceGraphResponse priceGraphResponse)

    {
        _searchRequestsMapper.Setup(srm => srm.MapPriceGraph(priceGraphRequest, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(searchAvailablePackagesRequest)
            .Verifiable();

        _marketService.Setup(ms => ms.GetMarket(priceGraphRequest.MarketCode))
            .Returns(marketSettings)
            .Verifiable();

        _hotelsService.Setup(hs => hs.Search(It.IsAny<string[]>()))
            .ReturnsAsync([hotel])
            .Verifiable();

        SetSearchOffersResponse(searchOffersResponse.ToArray());

        // Act
        var response = await _sut.PriceGraph(priceGraphRequest);

        response.Should().NotBeNull();
        response.Offers.Count.Should().Be(priceGraphResponse.Offers.Count);
        response.Offers.TrueForAll(o => o.Board == priceGraphRequest.BoardType);
        response.Offers.TrueForAll(o => o is not null);

        for (int i = 0; i < response.Offers.Count; i++)
        {
            response.Offers[i].Should().BeEquivalentTo(priceGraphResponse.Offers[i]);
        }

        _searchOffersServiceMock.Verify();
        _marketService.Verify();
        _hotelsService.Verify();
    }

    [Theory]
    [ClassData(typeof(PriceGraphMonthClassDataExtactMatch))]
    public async Task PriceGraph_PriceGraphMonthRequest_Returns(PriceGraphMonthRequest priceGraphRequest,
        SearchAvailablePackagesRequest searchAvailablePackagesRequest,
        MarketSettings marketSettings,
        List<AvCacheResultOffersOffer> searchOffersResponse,
        Hotel hotel,
        PriceGraphResponse priceGraphResponse)

    {
        _searchRequestsMapper.Setup(srm => srm.MapPriceGraph(priceGraphRequest, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(searchAvailablePackagesRequest)
            .Verifiable();

        _marketService.Setup(ms => ms.GetMarket(priceGraphRequest.MarketCode))
            .Returns(marketSettings)
            .Verifiable();

        _hotelsService.Setup(hs => hs.Search(It.IsAny<string[]>()))
            .ReturnsAsync([hotel])
            .Verifiable();

        SetSearchOffersResponse(searchOffersResponse.ToArray());

        // Act
        var response = await _sut.PriceGraph(priceGraphRequest);

        response.Should().NotBeNull();
        response.Offers.Count.Should().Be(priceGraphResponse.Offers.Count);
        response.Offers.TrueForAll(o => o.Board == priceGraphRequest.BoardType);
        response.Offers.TrueForAll(o => o is not null);

        for (int i = 0; i < response.Offers.Count; i++)
        {
            response.Offers[i].Should().BeEquivalentTo(priceGraphResponse.Offers[i]);
        }

        _searchOffersServiceMock.Verify();
        _marketService.Verify();
        _hotelsService.Verify();
    }

    [Theory]
    [ClassData(typeof(PriceGraphClassDataNoOffers))]
    public async Task PriceGraph_NoOffers_Returns15Offers(PriceGraphRequest priceGraphRequest,
        SearchAvailablePackagesRequest searchAvailablePackagesRequest,
        MarketSettings marketSettings,
        Hotel hotel,
        PriceGraphResponse priceGraphResponse)

    {
        _searchRequestsMapper.Setup(srm => srm.MapPriceGraph(priceGraphRequest, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(searchAvailablePackagesRequest)
            .Verifiable();

        _marketService.Setup(ms => ms.GetMarket(priceGraphRequest.MarketCode))
            .Returns(marketSettings)
            .Verifiable();

        _hotelsService.Setup(hs => hs.Search(It.IsAny<string[]>()))
            .ReturnsAsync([hotel])
            .Verifiable();

        SetSearchOffersResponse();

        // Act
        var response = await _sut.PriceGraph(priceGraphRequest);

        response.Should().NotBeNull();
        response.Offers.Count.Should().Be(priceGraphResponse.Offers.Count);
        response.Offers.TrueForAll(o => o.Board == priceGraphRequest.BoardType);
        response.Offers.TrueForAll(o => o is not null);

        for (int i = 0; i < response.Offers.Count; i++)
        {
            response.Offers[i].Should().BeEquivalentTo(priceGraphResponse.Offers[i]);
        }

        _searchOffersServiceMock.Verify();
        _marketService.Verify();
    }

    [Theory]
    [ClassData(typeof(PriceGraphClassDataIncomplete))]
    public async Task PriceGraph_ResultsIncomplete_Returns(PriceGraphRequest priceGraphRequest,
        SearchAvailablePackagesRequest searchAvailablePackagesRequest,
        MarketSettings marketSettings,
        AvCacheResultOffersOffer[] searchOffersResponse,
        Hotel hotel,
        PriceGraphResponse priceGraphResponse)
    {
        _searchRequestsMapper.Setup(srm => srm.MapPriceGraph(priceGraphRequest, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(searchAvailablePackagesRequest)
            .Verifiable();

        _marketService.Setup(ms => ms.GetMarket(priceGraphRequest.MarketCode))
            .Returns(marketSettings)
            .Verifiable();

        _hotelsService.Setup(hs => hs.Search(It.IsAny<string[]>()))
            .ReturnsAsync([hotel])
            .Verifiable();

        SetSearchOffersResponse(searchOffersResponse);

        // Act
        var response = await _sut.PriceGraph(priceGraphRequest);

        response.Should().NotBeNull();
        response.Offers.Count.Should().Be(priceGraphResponse?.Offers.Count);
        response.Offers.TrueForAll(o => o.Board == priceGraphRequest.BoardType);
        response.Offers.TrueForAll(o => o is not null);

        for (int i = 0; i < response.Offers.Count; i++)
        {
            response.Offers[i].Should().BeEquivalentTo(priceGraphResponse?.Offers[i]);
        }

        _searchOffersServiceMock.Verify();
        _marketService.Verify();
        _hotelsService.Verify();
    }

    [Theory]
    [ClassData(typeof(PriceGraphClassDataStartOfMonth))]
    public async Task PriceGraph_StartOfMonth_Returns(PriceGraphRequest priceGraphRequest,
        SearchAvailablePackagesRequest searchAvailablePackagesRequest,
        MarketSettings marketSettings,
        List<AvCacheResultOffersOffer> searchOffersResponse,
        Hotel hotel,
        PriceGraphResponse priceGraphResponse)

    {
        _searchRequestsMapper.Setup(srm => srm.MapPriceGraph(priceGraphRequest, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(searchAvailablePackagesRequest)
            .Verifiable();

        _marketService.Setup(ms => ms.GetMarket(priceGraphRequest.MarketCode))
            .Returns(marketSettings)
            .Verifiable();

        _hotelsService.Setup(hs => hs.Search(It.IsAny<string[]>()))
            .ReturnsAsync([hotel])
            .Verifiable();

        SetSearchOffersResponse(searchOffersResponse.ToArray());

        // Act
        var response = await _sut.PriceGraph(priceGraphRequest);

        response.Should().NotBeNull();
        response.Offers.Count.Should().Be(priceGraphResponse?.Offers.Count);
        response.Offers.TrueForAll(o => o.Board == priceGraphRequest.BoardType);
        response.Offers.TrueForAll(o => o is not null);

        for (int i = 0; i < response.Offers.Count; i++)
        {
            response.Offers[i].Should().BeEquivalentTo(priceGraphResponse?.Offers[i]);
        }

        _searchOffersServiceMock.Verify();
        _marketService.Verify();
        _hotelsService.Verify();
    }

    [Theory]
    [ClassData(typeof(PriceGraphClassDataMultiRoomExtactMatch))]
    public async Task PriceGraph_MultiRoom_Returns(PriceGraphRequest priceGraphRequest,
        SearchAvailablePackagesRequest searchAvailablePackagesRequest,
        MarketSettings marketSettings,
        List<AvCacheResultOffersOffer> searchOffersResponse,
        Hotel hotel,
        PriceGraphResponse priceGraphResponse)

    {
        _searchRequestsMapper.Setup(srm => srm.MapPriceGraph(priceGraphRequest, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(searchAvailablePackagesRequest)
            .Verifiable();

        _marketService.Setup(ms => ms.GetMarket(priceGraphRequest.MarketCode))
            .Returns(marketSettings)
            .Verifiable();

        _hotelsService.Setup(hs => hs.Search(It.IsAny<string[]>()))
            .ReturnsAsync([hotel])
            .Verifiable();

        SetSearchOffersResponse(searchOffersResponse.ToArray());

        // Act
        var response = await _sut.PriceGraph(priceGraphRequest);

        response.Should().NotBeNull();
        response.Offers.Count.Should().Be(priceGraphResponse.Offers.Count);
        response.Offers.TrueForAll(o => o is not null);
        response.Offers.Where(o => o.Rooms is not null).ToList().TrueForAll(o => o.Rooms.Count == 2);

        for (int i = 0; i < response.Offers.Count; i++)
        {
            response.Offers[i].Should().BeEquivalentTo(priceGraphResponse.Offers[i]);
        }

        _searchOffersServiceMock.Verify();
        _offersMapper.Verify();
        _marketService.Verify();
        _hotelsService.Verify();
    }

    [Fact]
    public async Task PriceGraph_PriceGraphMonthRequest_InvalidSearchDate_ThrowsApiException()
    {
        // Arrange
        var request = new PriceGraphMonthRequest
        {
            Start = DateTime.Now.ToString(REQUIRED_DATETIME_FORMAT),
            End = DateTime.Now.AddDays(107).ToString(REQUIRED_DATETIME_FORMAT),
        };

        // Act
        Func<Task<PriceGraphResponse>> action = async () => await _sut.PriceGraph(request);

        // Assert
        var exc = await Assert.ThrowsAsync<ApiException>(action);
    }

    [Fact]
    public async Task SearchAccommodationOffer_StaticSystem_ShouldNotReturnExternalCodes()
    {
        var request = GetOfferRequestWithSelectedRoom("TW01");
        SetSearchOffersResponse(
            new AvCacheResultOffersOffer()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit("TW01").Build(),
                Price = 100,
                PricePP = 100,
            });

        // Act
        var result = await _sut.SearchAccommodationOffer(request);

        // Assert
        result.Should().NotBeNull();
        result.Offers.Should().HaveCount(1);
        result.Offers[0].FirstUnit().Should().NotBeNull();
        result.Offers[0].FirstUnit().ExternalRoomCode.Should().BeNull();
        result.Offers[0].FirstUnit().ExternalBoardCode.Should().BeNull();
    }

    [Fact]
    public async Task SearchAccommodationOffer_DynamicSystem_ShouldReturnExternalCodes()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");
        SetSearchOffersResponse(
            new AvCacheResultOffersOffer()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW01", system: "TGX", extRoomCode: "2269!BAR.14", extBoardCode: "14").Build(),
                Price = 100,
                PricePP = 100,
            });

        // Act
        var result = await _sut.SearchAccommodationOffer(request);

        // Assert
        result.Should().NotBeNull();
        result.Offers.Should().HaveCount(1);
        result.Offers[0].FirstUnit().Should().NotBeNull();
        result.Offers[0].FirstUnit().ExternalRoomCode.Should().Be("2269!BAR.14");
        result.Offers[0].FirstUnit().ExternalBoardCode.Should().Be("14");
    }

    [Fact]
    public async Task RoomVariants_ShouldSearchAlternativeAccomodations()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");
        request.AccommodationId = "X001";
        request.PackageId = "0000/0/2222/5";
        request.AlternativeAccomodations = new AlternativeAccomodation[]
        {
            new() { AccomodationId = "ES002", PackageId = "12345/2/2001/4" },
            new() { AccomodationId = "Q003", PackageId = "1234567/3/2002" },
        };

        SetSearchOffersResponse(
                new AvCacheResultOffersOffer
                {
                    Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW01").Build(),
                    Price = 100,
                    PricePP = 100,
                });

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();

        _searchOffersApiServiceMock.Verify(s =>
            s.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                It.Is<SearchAvailablePackagesRequest>(
                    r => r.AccommodationId == "X001" && r.PackageId == "0000/0/2222/5")), Times.Once);

        _searchOffersApiServiceMock.Verify(s =>
            s.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                It.Is<SearchAvailablePackagesRequest>(
                    r => r.AccommodationId == "ES002" && r.PackageId == "12345/2/2001/4")), Times.Once);

        _searchOffersApiServiceMock.Verify(s =>
            s.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                It.Is<SearchAvailablePackagesRequest>(
                    r => r.AccommodationId == "Q003" && r.PackageId == "1234567/3/2002")), Times.Once);
    }

    [Fact]
    public async Task AltBoards_ShouldReturnBoardsRequiredRoomAlternation()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");
        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW01").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 120, },
                },
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW02").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 120, },
                    new AvCacheResultOffersOfferBoard { Code = "AI", Price = 220, },
                },
            });

        _boardService.Setup(bs => bs.GetAllAlternativeBoards(It.IsAny<IEnumerable<AvCacheResultOffersOffer>>(), request.BoardType))
            .Returns(new List<AvCacheResultOffersOfferBoard> {
                        new AvCacheResultOffersOfferBoard{ Code = "HH",Price = 120.00m, UnitCode = "TW01" },
                        new AvCacheResultOffersOfferBoard{ Code = "HH",Price = 120.00m, UnitCode = "TW02" },
                        new AvCacheResultOffersOfferBoard{ Code = "AI",Price = 220.00m, UnitCode = "TW02" },
            }.ToArray());

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([
                new AltBoardType {
                    Code = "AI",
                    UnitCode = "TW02",
                    UnitCodes = new Dictionary<string, string> { { "TW01", "TW02" } },
                    Price = 220,
                    PricePP = 220,
                    RoomAlterations = new Dictionary<string, string> { { "TW01", "TW02"} }},
                new AltBoardType {
                    Code = "AI",
                    UnitCode = "TW02",
                    UnitCodes = new Dictionary<string, string> { { "TW01", "TW02" } },
                    Price = 220,
                    PricePP = 220,
                    RoomAlterations = new Dictionary<string, string> { { "TW01", "TW02"} }}]);

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.AltBoards.Should().HaveCount(2);
        result.AltBoards.Should().Contain(board =>
            board.Code == "AI" &&
            board.UnitCode == "TW02" &&
            board.UnitCodes["TW01"] == "TW02" &&
            board.Price == 220 &&
            board.PricePP == 220 &&
            board.RoomAlterations["TW01"] == "TW02");
    }

    [Fact]
    public async Task AltBoards_MultiRoom_ShouldReturnBoardsRequiredRoomAlteration()
    {
        // Arrange
        var request = GetOfferMultiRoomRequest(["TW01", "TW02", "TW03"]);
        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW01").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard =
                [
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 120, },
                ],
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW02").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard =
                [
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 140, },
                    new AvCacheResultOffersOfferBoard { Code = "AI", Price = 240, },
                ],
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW03", roomBoard: "HH").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard =
                [
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 160, },
                    new AvCacheResultOffersOfferBoard { Code = "AI", Price = 260, },
                ]
            });

        _boardService
            .Setup(bs => bs.BoardCodesAreEqual(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(true);

        _boardService.Setup(bs => bs.GetAllAlternativeBoards(It.IsAny<IEnumerable<AvCacheResultOffersOffer>>(), request.BoardType))
            .Returns(new List<AvCacheResultOffersOfferBoard> {
                new AvCacheResultOffersOfferBoard{ Code = "HH",Price = 100.00m, UnitCode = "TW03" },
                new AvCacheResultOffersOfferBoard{ Code = "HH",Price = 120.00m, UnitCode = "TW01" },
                new AvCacheResultOffersOfferBoard{ Code = "HH",Price = 140.00m, UnitCode = "TW02" },
                new AvCacheResultOffersOfferBoard{ Code = "HH", Price = 160.00m, UnitCode = "TW03" },
                new AvCacheResultOffersOfferBoard{ Code = "AI", Price = 240.00m, UnitCode = "TW02" },
                new AvCacheResultOffersOfferBoard{ Code = "AI", Price = 260.00m, UnitCode = "TW03" },
            }.ToArray());

        _boardService.SetupSequence(bs => bs.GetBoardPrice(It.IsAny<AvCacheResultOffersOffer>(), It.IsAny<string>()))
            .Returns(100)
            .Returns(140)
            .Returns((decimal?)null)
            .Returns(100)
            .Returns(100)
            .Returns(120)
            .Returns((decimal?)null)
            .Returns(100)
            .Returns(100)
            .Returns(120)
            .Returns(100)
            .Returns(140);

        _boardService.SetupSequence(bs => bs.GetAlternateBoardByBoardCode(It.IsAny<AltBoardType[]>(), It.IsAny<string>()))
            .Returns(new AltBoardType
            {
                Code = "HH",
                Price = 120,
                PricePP = 120,
                RoomAlterations = new() { { "TW01", null }, { "TW02", null }, { "TW03", null } },
                UnitCodes = new() { { "TW01", null }, { "TW02", null }, { "TW03", null } },
                UnitCode = "TW01"
            })
            .Returns(new AltBoardType
            {
                Code = "AI",
                Price = 240,
                PricePP = 240,
                RoomAlterations = new() { { "TW01", "TW02" }, { "TW02", null }, { "TW03", null } },
                UnitCodes = new() { { "TW01", "TW02" }, { "TW02", null }, { "TW03", null } },
                UnitCode = "TW02"
            })
            .Returns(new AltBoardType
            {
                Code = "HH",
                Price = 260,
                PricePP = 130,
                RoomAlterations = new() { { "TW01", null }, { "TW02", null }, { "TW03", null } },
                UnitCodes = new() { { "TW01", null }, { "TW02", null }, { "TW03", null } },
                UnitCode = "TW01"
            })
            .Returns(new AltBoardType
            {
                Code = "AI",
                Price = 480,
                PricePP = 240,
                RoomAlterations = new() { { "TW01", "TW02" }, { "TW02", null }, { "TW03", null } },
                UnitCodes = new() { { "TW01", "TW02" }, { "TW02", null }, { "TW03", null } },
                UnitCode = "TW02"
            });

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([
                new AltBoardType { Code = "AI", UnitCode = "TW02", UnitCodes = new([KeyValuePair.Create("TW01", "TW02")]), Price = 740, RoomAlterations = new([KeyValuePair.Create("TW01", "TW02")])},
                new AltBoardType { Code = "AI", UnitCode = "TW02", UnitCodes = new([KeyValuePair.Create("TW01", "TW02")]), Price = 740, RoomAlterations = new([KeyValuePair.Create("TW01", "TW02")])}]
                );

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.AltBoards.Should().HaveCount(2);
        result.AltBoards.Should().Contain(board =>
                board.Code == "AI" &&
                board.UnitCode == "TW02" &&
                board.UnitCodes["TW01"] == "TW02" &&
                board.Price == 740 &&
                board.RoomAlterations["TW01"] == "TW02");
    }

    [Fact]
    public async Task AltBoards_ShouldReturnCheapestAlternativeBoard()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");
        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW01").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 140, },
                },
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW01").Build(),
                Price = 110,
                PricePP = 110,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 135, },
                },
            });

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([
                new AltBoardType {
                            Code = "HH",
                            UnitCode = "HH",
                            UnitCodes = new Dictionary<string, string> { { "TW01", "TW02" } },
                            Price = 135,
                            PricePP = 220,
                            RoomAlterations = new Dictionary<string, string> { { "TW01", "TW02"} } } ]);

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.AltBoards.Should().HaveCount(1);
        result.AltBoards.Should().Contain(board => board.Price == 135 && board.Code == "HH");
    }

    [Fact]
    public async Task AltBoards_ShouldReturnCheapestBoardsRequiredRoomAlternation()
    {
        _boardService
            .Setup(bs => bs.BoardCodesAreEqual(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(true);

        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");
        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW01").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 120, },
                },
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW02").Build(),
                Price = 140,
                PricePP = 140,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 160, },
                    new AvCacheResultOffersOfferBoard { Code = "AI", Price = 220, },
                },
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW03").Build(),
                Price = 150,
                PricePP = 150,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 170, },
                    new AvCacheResultOffersOfferBoard { Code = "AI", Price = 200, },
                },
            });

        _boardService.Setup(bs => bs.GetAllAlternativeBoards(It.IsAny<IEnumerable<AvCacheResultOffersOffer>>(), request.BoardType))
            .Returns(new List<AvCacheResultOffersOfferBoard> {
                        new AvCacheResultOffersOfferBoard{ Code = "HH",Price = 120.00m, UnitCode = "TW01" },
                        new AvCacheResultOffersOfferBoard{ Code = "HH",Price = 160.00m, UnitCode = "TW02" },
                        new AvCacheResultOffersOfferBoard{ Code = "HH",Price = 170.00m, UnitCode = "TW03" },
                        new AvCacheResultOffersOfferBoard{ Code = "AI", Price = 200.00m, UnitCode = "TW03" },
                        new AvCacheResultOffersOfferBoard{ Code = "AI", Price = 220.00m, UnitCode = "TW02" },
            }.ToArray());

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([
                new AltBoardType {
                                    Code = "AI",
                                    UnitCode = "TW03",
                                    UnitCodes = new Dictionary<string, string> { { "TW01", "TW03" } },
                                    Price = 200,
                                    PricePP = 200,
                                    RoomAlterations = new Dictionary<string, string> { { "TW01", "TW03"} } },
                new AltBoardType {
                                    Code = "HH",
                                    UnitCode = "HH",
                                    UnitCodes = new Dictionary<string, string> { { "TW01", "TW02" } },
                                    Price = 135,
                                    PricePP = 220,
                                    RoomAlterations = new Dictionary<string, string> { { "TW01", "TW02"} } } ]);



        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.AltBoards.Should().HaveCount(2);
        result.AltBoards.Should().Contain(board =>
                board.Code == "AI" &&
                board.UnitCode == "TW03" &&
                board.UnitCodes["TW01"] == "TW03" &&
                board.Price == 200 &&
                board.PricePP == 200 &&
                board.RoomAlterations["TW01"] == "TW03");
    }

    [Fact]
    public async Task AltBoards_ShouldNotRequireRoomAlternation_When_CompositeUnitCodeAndSameRoom()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("DBL.IN!NOR.CG-FIT RO");
        SetSearchOffersResponse(
            new AvCacheResultOffersOffer()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(ext: true).WithUnit(roomCode: "DBL.IN!NOR.CG-FIT RO").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "BB", Price = 120, UnitCode = "DBL.IN!NOR.CG-FIT BB" },
                },
            });

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([
                new AltBoardType
                {
                    Code = "BB",
                    UnitCode = "DBL.IN!NOR.CG-FIT BB",
                    UnitCodes = new([KeyValuePair.Create("DBL.IN!NOR.CG-FIT RO", "DBL.IN!NOR.CG-FIT BB")]),
                    Price = 120,
                    PricePP = 120,
                    IsExternal = true,
                    RoomAlterations = new Dictionary<string, string> { { "DBL.IN!NOR.CG-FIT RO", null } } } ]
                );

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.AltBoards.Should().HaveCount(1);
        result.AltBoards.Should().ContainEquivalentOf(
            new AltBoardType
            {
                Code = "BB",
                UnitCode = "DBL.IN!NOR.CG-FIT BB",
                UnitCodes = new Dictionary<string, string> { { "DBL.IN!NOR.CG-FIT RO", "DBL.IN!NOR.CG-FIT BB" } },
                Price = 120,
                PricePP = 120,
                IsExternal = true,
                RoomAlterations = new Dictionary<string, string> { { "DBL.IN!NOR.CG-FIT RO", null } },
            });
    }

    [Fact]
    public async Task AltBoards_ShouldRequireRoomAlternation_When_CompositeUnitCodeAndDiffRooms()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("DBL.IN!NOR.CG-FIT RO");

        SetSearchOffersResponse(
            new AvCacheResultOffersOffer()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder()
                    .WithAccommadation(ext: true)
                    .WithUnit(roomCode: "DBL.IN!NOR.CG-FIT RO").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "BB", Price = 120, UnitCode = "DBL.IN!NOR.CG-FIT BB" },
                },
            },
            new AvCacheResultOffersOffer()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(ext: true).WithUnit(roomCode: "DBL.SU!NOR.CG-FIT RO").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "HB", Price = 120, UnitCode = "DBL.SU!NOR.CG-FIT MP" },
                },
            });

        _boardService.Setup(bs => bs.GetAllAlternativeBoards(It.IsAny<IEnumerable<AvCacheResultOffersOffer>>(), request.BoardType))
            .Returns(new List<AvCacheResultOffersOfferBoard> {
                        new AvCacheResultOffersOfferBoard{ Code = "BB",Price = 120.00m, UnitCode = "DBL.IN!NOR.CG-FIT BB", IsExternal = true },
                        new AvCacheResultOffersOfferBoard{ Code = "HB",Price = 120.00m, UnitCode = "DBL.SU!NOR.CG-FIT MP", IsExternal = true },
            }.ToArray());

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([
                new AltBoardType {
                    Code = "HB",
                    UnitCode = "DBL.SU!NOR.CG-FIT MP",
                    UnitCodes = new([KeyValuePair.Create("DBL.IN!NOR.CG-FIT RO", "DBL.SU!NOR.CG-FIT MP")]),
                    Price = 120,
                    PricePP =  120,
                    IsExternal = true,
                    RoomAlterations = new([KeyValuePair.Create("DBL.IN!NOR.CG-FIT RO", "DBL.SU!NOR.CG-FIT MP")])},
                new AltBoardType {
                    Code = "HB",
                    UnitCode = "DBL.SU!NOR.CG-FIT MP",
                    UnitCodes = new([KeyValuePair.Create("DBL.IN!NOR.CG-FIT RO", "DBL.SU!NOR.CG-FIT MP")]),
                    Price = 120,
                    PricePP =  120,
                    IsExternal = true,
                    RoomAlterations = new([KeyValuePair.Create("DBL.IN!NOR.CG-FIT RO", "DBL.SU!NOR.CG-FIT MP")])}]
                );

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.AltBoards.Should().HaveCount(2);
        result.AltBoards.Should().ContainEquivalentOf(
            new AltBoardType
            {
                Code = "HB",
                UnitCode = "DBL.SU!NOR.CG-FIT MP",
                UnitCodes = new Dictionary<string, string> { { "DBL.IN!NOR.CG-FIT RO", "DBL.SU!NOR.CG-FIT MP" } },
                Price = 120,
                PricePP = 120,
                RoomAlterations = new Dictionary<string, string> { { "DBL.IN!NOR.CG-FIT RO", "DBL.SU!NOR.CG-FIT MP" } },
                IsExternal = true,
            });
    }

    [Fact]
    public async Task AltBoards_ShouldReturnAccomodationId()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");

        SetSearchOffersResponse(
            new AvCacheResultOffersOffer()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW01").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "BB", Price = 120, },
                },
            });

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
        .Returns([new AltBoardType { AccommodationId = "X001" }]);

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.AltBoards.Should().HaveCount(1);
        result.AltBoards.First().AccommodationId.Should().Be("X001");
    }

    [Fact]
    public async Task AltBoards_ShouldReturnPackageId()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");

        SetSearchOffersResponse(
            new AvCacheResultOffersOffer()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(packageId: "6125464/2/1299/7").WithUnit(roomCode: "TW01").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard =
                [
                    new AvCacheResultOffersOfferBoard { Code = "BB", Price = 120, },
                ],
            });

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([new AltBoardType { PackageId = "6125464/2/1299/7" }]);

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.AltBoards.Should().HaveCount(1);
        result.AltBoards.First().PackageId.Should().Be("6125464/2/1299/7");
    }

    [Fact]
    public async Task AltBoards_ShouldBeIsExternalWhenExternalAccommodation()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");

        SetSearchOffersResponse(
            new AvCacheResultOffersOffer()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(packageId: "6125464/2/1299/7", ext: true).WithUnit(roomCode: "TW01").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "BB", Price = 120, },
                },
            });

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([new AltBoardType { PackageId = "6125464/2/1299/7", IsExternal = true }]);

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.AltBoards.Should().HaveCount(1);
        result.AltBoards.First().PackageId.Should().Be("6125464/2/1299/7");
        result.AltBoards.First().IsExternal.Should().BeTrue();
    }

    [Fact]
    public async Task AltRooms_ShouldReturnPackageId()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");

        SetSearchOffersResponse(
            new AvCacheResultOffersOffer()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(packageId: "6125464/2/1299/7").WithUnit(roomCode: "TW01").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "BB", Price = 120, },
                },
            });

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([new AltBoardType { PackageId = "6125464/2/1299/7", IsExternal = true }]);

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.SearchOffersResponses.Should().HaveCount(1);
        result.AltBoards.Should().HaveCount(1);
        result.SearchOffersResponses[0].Offers[0].FirstUnit().PackageId.Should().Be("6125464/2/1299/7");
    }

    [Fact]
    public async Task AltRooms_ShouldReturnAccomodationId()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");

        SetSearchOffersResponse(
            new AvCacheResultOffersOffer()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation("X001").WithUnit("TW01").Build(),
                Price = 100,
                PricePP = 100,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "BB", Price = 120, },
                },
            });

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([new AltBoardType { AccommodationId = "X001" }]);

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.SearchOffersResponses.Should().HaveCount(1);
        result.AltBoards.Should().HaveCount(1);
        result.SearchOffersResponses[0].Offers[0].FirstUnit().AccommodationId.Should().Be("X001");
    }

    [Fact]
    public async Task AltRooms_ShouldSearchAlternativeAccomodations()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");
        request.AccommodationId = "X001";
        request.PackageId = "0000/0/2222/5";
        request.AlternativeAccomodations = new AlternativeAccomodation[]
        {
            new() { AccomodationId = "ES002", PackageId = "12345/2/2001/4" },
            new() { AccomodationId = "Q003", PackageId = "1234567/3/2002" },
        };

        SetSearchOffersResponse(
                new AvCacheResultOffersOffer
                {
                    Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit("TW01").Build(),
                    Price = 100,
                    PricePP = 100
                }
            );

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();

        _searchOffersApiServiceMock.Verify(s =>
            s.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                It.Is<SearchAvailablePackagesRequest>(
                    r => r.AccommodationId == "X001" && r.PackageId == "0000/0/2222/5")), Times.Once);

        _searchOffersApiServiceMock.Verify(s =>
            s.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                It.Is<SearchAvailablePackagesRequest>(
                    r => r.AccommodationId == "ES002" && r.PackageId == "12345/2/2001/4")), Times.Once);

        _searchOffersApiServiceMock.Verify(s =>
            s.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                It.Is<SearchAvailablePackagesRequest>(
                    r => r.AccommodationId == "Q003" && r.PackageId == "1234567/3/2002")), Times.Once);
    }

    [Fact]
    public async Task AltRooms_ShouldReturnCheapest()
    {
        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01");
        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW02", roomPrice: 120).Build(),
                Price = 120,
                PricePP = 120,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW02", roomPrice: 110).Build(),
                Price = 110,
                PricePP = 110,
            });

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.SearchOffersResponses.Should().HaveCount(1);
        result.SearchOffersResponses[0].Offers.Should().HaveCount(1);
        result.SearchOffersResponses[0].Offers[0].FirstUnit().Price.Should().Be(110);
        result.SearchOffersResponses[0].Offers[0].FirstUnit().AccommodationId.Should().Be("X001");
    }

    [Fact]
    public async Task AltRooms_MultiRoom_ShouldBeCheapest()
    {
        // Arrange
        var request = GetOfferMultiRoomRequest(new[] { "TW01", "TW02" }, accomId: "W001");
        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW01", roomPrice: 120, system: "Dynamic").Build(),
                Price = 120,
                PricePP = 120,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW01", roomPrice: 110).Build(),
                Price = 110,
                PricePP = 110,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW02", roomPrice: 130, system: "Dynamic").Build(),
                Price = 130,
                PricePP = 130,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW02", roomPrice: 160).Build(),
                Price = 160,
                PricePP = 160,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW03", roomPrice: 195, system: "Dynamic").Build(),
                Price = 195,
                PricePP = 195,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW03", roomPrice: 180).Build(),
                Price = 180,
                PricePP = 180,
            });

        // Act
        var responses = await _sut.RoomVariants(request);
        var result = AlternativeRoomsBuilder.BuildResponse(responses, request);

        result.Should().NotBeNull();
        result.Rooms.Should().HaveCount(2);
        result.Rooms.ElementAt(0).Should().HaveCount(3);
        result.Rooms.ElementAt(1).Should().HaveCount(3);

        result.Rooms.ElementAt(0).Should().Contain(room => room.Code == "TW02" && room.Price == 130);
        result.Rooms.ElementAt(0).Should().Contain(room => room.Code == "TW03" && room.Price == 195);

        result.Rooms.ElementAt(1).Should().Contain(room => room.Code == "TW01" && room.Price == 120);
        result.Rooms.ElementAt(1).Should().Contain(room => room.Code == "TW03" && room.Price == 195);
    }

    [Fact]
    public async Task AltRooms_MultiRoom_ShouldContainAllSelectedRoomInContract()
    {
        // Arrange
        var request = GetOfferMultiRoomRequest(new[] { "TW01", "TW02" }, accomId: "W001");
        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW01", roomPrice: 120, system: "Dynamic").Build(),
                Price = 120,
                PricePP = 120,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW01", roomPrice: 110).Build(),
                Price = 110,
                PricePP = 110,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW02", roomPrice: 130, system: "Dynamic").Build(),
                Price = 130,
                PricePP = 130,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW03", roomPrice: 195, system: "Dynamic").Build(),
                Price = 195,
                PricePP = 195,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW03", roomPrice: 180).Build(),
                Price = 180,
                PricePP = 180,
            });

        // Act
        var responses = await _sut.RoomVariants(request);
        var result = AlternativeRoomsBuilder.BuildResponse(responses, request);

        result.Should().NotBeNull();
        result.Rooms.Should().HaveCount(2);
        result.Rooms.ElementAt(0).Should().HaveCount(3);
        result.Rooms.ElementAt(1).Should().HaveCount(3);

        result.Rooms.ElementAt(0).Should().Contain(room => room.Code == "TW02" && room.Price == 130);
        result.Rooms.ElementAt(0).Should().Contain(room => room.Code == "TW03" && room.Price == 195);

        result.Rooms.ElementAt(1).Should().Contain(room => room.Code == "TW01" && room.Price == 120);
        result.Rooms.ElementAt(1).Should().Contain(room => room.Code == "TW03" && room.Price == 195);
    }

    [Fact]
    public async Task AltRooms_MultiRoom_ShouldNotifyAboutMoreRoomAlterations()
    {
        // Arrange
        var request = GetOfferMultiRoomRequest(new[] { "TW01", "TW01" }, accomId: "W001");
        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW01", roomPrice: 110, system: "Dynamic").Build(),
                Price = 110,
                PricePP = 110,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW01", roomPrice: 112).Build(),
                Price = 112,
                PricePP = 112,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW02", roomPrice: 140, system: "Dynamic").Build(),
                Price = 140,
                PricePP = 140,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW02", roomPrice: 135).Build(),
                Price = 135,
                PricePP = 135,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW03", roomPrice: 195, roomBoard: "BB", system: "Dynamic").Build(),
                Price = 195,
                PricePP = 195,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW03", roomPrice: 180, roomBoard: "BB").Build(),
                Price = 180,
                PricePP = 180,
            });

        // Act
        var responses = await _sut.RoomVariants(request);
        var result = AlternativeRoomsBuilder.BuildResponse(responses, request);

        result.Should().NotBeNull();
        result.Rooms.Should().HaveCount(2);
        result.Rooms.ElementAt(0).Should().HaveCount(3);
        result.Rooms.ElementAt(1).Should().HaveCount(3);

        result.Rooms.ElementAt(0).Should().Contain(room => room.Code == "TW02" && room.Price == 137 &&
            room.RequireMoreRoomAlteration == true);
        result.Rooms.ElementAt(0).Should().Contain(room => room.Code == "TW03" && room.Price == 182 &&
            room.RequireMoreRoomAlteration == true);

        result.Rooms.ElementAt(1).Should().Contain(room => room.Code == "TW02" && room.Price == 140);
        result.Rooms.ElementAt(1).Should().Contain(room => room.Code == "TW03" && room.Price == 195);
    }

    [Fact]
    public async Task AltRooms_ShouldReturnWithBoardAlteration()
    {
        _boardService.Setup(bc => bc.BoardCodesAreEqual(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(true);

        // Arrange
        var request = GetOfferRequestWithSelectedRoom("TW01", boardType: "HH");
        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW02", roomPrice: 120, roomBoard: "BB").Build(),
                Price = 120,
                PricePP = 120,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "HH", Price = 140, },
                    new AvCacheResultOffersOfferBoard { Code = "AI", Price = 240, },
                },
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW03", roomPrice: 240, roomBoard: "AI").Build(),
                Price = 260,
                PricePP = 260,
                AltBoard = [],
            });

        // Act
        var result = await _sut.RoomVariants(request);

        // Assert
        result.Should().NotBeNull();
        result.SearchOffersResponses.Should().HaveCount(1);
        result.SearchOffersResponses[0].Offers.Should().Contain(offer => offer.FirstUnit().Code == "TW03" &&
            offer.FirstUnit().RequireBoardAlteration == "AI");
    }

    [Fact]
    public async Task AltRooms_ShouldReturnForOtherRoomsSameContractAsFirstSelectedRoom()
    {
        // Arrange
        var request = GetOfferMultiRoomRequest(new[] { "TW01", "TW01" }, accomId: "W001");
        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW01", roomPrice: 110, system: "Dynamic").Build(),
                Price = 110,
                PricePP = 110,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW01", roomPrice: 120).Build(),
                Price = 120,
                PricePP = 120,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "W001").WithUnit(roomCode: "TW02", roomPrice: 150, system: "Dynamic").Build(),
                Price = 150,
                PricePP = 150,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW02", roomPrice: 135).Build(),
                Price = 135,
                PricePP = 135,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation(accomId: "X001").WithUnit(roomCode: "TW03", roomPrice: 195).Build(),
                Price = 195,
                PricePP = 195,
            });

        // Act
        var responses = await _sut.RoomVariants(request);
        var result = AlternativeRoomsBuilder.BuildResponse(responses, request);

        result.Should().NotBeNull();
        result.Rooms.Should().HaveCount(2);
        result.Rooms.ElementAt(0).Should().HaveCount(3);
        result.Rooms.ElementAt(1).Should().HaveCount(2);

        result.Rooms.ElementAt(0).Should().Contain(room => room.Code == "TW02" && room.Price == 145);
        result.Rooms.ElementAt(0).Should().Contain(room => room.Code == "TW03" && room.Price == 205);

        result.Rooms.ElementAt(1).Should().OnlyContain(room =>
            room.AccommodationId == "W001" && room.RequireMoreRoomAlteration == false);
    }

    [Fact]
    public async Task RoomVariants_ShouldTakeIntoAccountNonDefaultPriceForAltBoards()
    {
        _boardService
            .Setup(bc => bc.BoardCodesAreEqual(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(true);

        // Arrange
        var accomodationId = "ESMJ0065";
        var sharedTransferCode = "JUMB005865SS";
        var privateTransferCode = "JUMB005848PP";
        var noTransferCode = "JUMB005865NS";

        var request = GetOfferRequestWithSelectedRoom("TW01", "HB");
        request.Transfer = privateTransferCode;
        request.Room[0].Adults = 2;

        var offerTransfer = new AvCacheResultOffersOfferTransfers
        {
            Price = 40,
            Transfer =
            [
                new AvCacheResultOffersOfferTransfersTransfer
                {
                    Code = $"{accomodationId}~~{sharedTransferCode}",
                    Price = 40
                }
            ]
        };

        SetSearchOffersResponse(
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder()
                .WithAccommadation(accomId: accomodationId)
                .WithUnit(roomCode: "TW01", roomPrice: 1500, roomPricePP: 750, roomBoard: "HB")
                .Build(),
                Price = 1800,
                PricePP = 900,
                AltBoard = new[]
                {
                    new AvCacheResultOffersOfferBoard { Code = "AI", Price = 1880, },
                },
                Transfers = offerTransfer,
            },
            new()
            {
                Accom = new AtComBuilders.AtcomAccommadationResponseBuilder()
                    .WithAccommadation(accomId: accomodationId)
                    .WithUnit(roomCode: "TW02", roomPrice: 1600, roomPricePP: 800, roomBoard: "AI")
                    .Build(),
                Price = 1900,
                PricePP = 950,
                Transfers = offerTransfer,
            });

            _hotelOfferServiceMock.Setup(x => x.SetOfferTransfer(It.IsAny<Holidays.Api.Domain.Data.PackageOffers.Offer>(), It.IsAny<string>())).
                Callback<Holidays.Api.Domain.Data.PackageOffers.Offer, string>((x, y) =>
                {
                    x.Transfers = new List<TransferItem> { new TransferItem { Code = y } };
                })
                .Returns(true);

            _transferServiceMock.Setup(x => x.GetAll(It.IsAny<Holidays.Api.Domain.Data.PackageOffers.Offer>(), (IEnumerable<TransferItem>)null))
                .ReturnsAsync(
                    new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = sharedTransferCode,
                            Price = 40
                        },
                        new TransferItem
                        {
                            Code = privateTransferCode,
                            Price = 120
                        },
                        new TransferItem
                        {
                            Code = noTransferCode,
                            Price = 40
                        }
                    });

        _boardService.Setup(bs => bs.DistinctAlternateBoards(It.IsAny<AltBoardType[]>()))
            .Returns([new AltBoardType { Code = "AI", Price = 1960, PricePP = 980 }]);

        // Act
        var res = await _sut.RoomVariants(request);

        // Assert
        res.AltBoards.Should().HaveCount(1);

        var altBoard = res.AltBoards.First();
        altBoard.Code.Should().Be("AI");
        altBoard.Price.Should().Be(1960); //alt board price for TW01 + delta between private and shared transfer
        altBoard.PricePP.Should().Be(980);

        }

            private void SetSearchOffersResponse(params AvCacheResultOffersOffer[] offers)
        {
            _searchOffersApiServiceMock
                .Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.IsAny<SearchAvailablePackagesRequest>()))
                .ReturnsAsync(GetSearchResponse(offers));
        }

    private static AccommodationOfferRequest GetOfferRequestWithSelectedRoom(string roomCode, string boardType = null)
        => new()
        {
            StartDate = DateTime.Now.AddDays(7).ToString(REQUIRED_DATETIME_FORMAT),
            Duration = new List<int> { 7 },
            Room = new List<RoomAllocation>()
            {
                new RoomAllocation
                {
                    Adults = 1,
                    RoomCode = roomCode,
                }
            },
            BoardType = boardType,
        };

    private static AccommodationOfferRequest GetOfferMultiRoomRequest(string[] roomCodes, string accomId = null)
        => new()
        {
            StartDate = DateTime.Now.AddDays(7).ToString(REQUIRED_DATETIME_FORMAT),
            Duration = new List<int> { 7 },
            Room = roomCodes.Select(code => new RoomAllocation { Adults = 2, RoomCode = code }).ToList(),
            AccommodationId = accomId,
        };

    private static SearchAvailablePackagesResponse GetSearchResponse(AvCacheResultOffersOffer[] offers)
        => new()
        {
            Payload = new Domain.Models.Api.Payload.XmlApiPayload<AvCache>()
            {
                Body = new AvCache
                {
                    Result = new AvCacheResult
                    {
                        Offers = new AvCacheResultOffers
                        {
                            Count = (uint)offers.Length,
                            CountSpecified = true,
                            Lists = new AvCacheResultOffersLists() { },
                            Facets = GetDummyFacets(),
                            Offer = offers,
                        }
                    }
                }
            }
        };

    private static AvCacheResultOffersCat[] GetDummyFacets()
        => new AvCacheResultOffersCat[]
        {
            new AvCacheResultOffersCat(){ Code = "a", Facet = new AvCacheResultOffersCatFacet[]{ new AvCacheResultOffersCatFacet() { } } },
            new AvCacheResultOffersCat(){ Code = "b", Facet = new AvCacheResultOffersCatFacet[]{ new AvCacheResultOffersCatFacet() { } } },
            new AvCacheResultOffersCat(){ Code = "c", Facet = new AvCacheResultOffersCatFacet[]{ new AvCacheResultOffersCatFacet() { } } },
        };
}
