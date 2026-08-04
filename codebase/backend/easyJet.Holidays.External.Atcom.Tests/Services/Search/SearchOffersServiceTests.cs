#nullable enable

using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Extensions;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using PackagesSearchRequest = easyJet.Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest;
using RoomAllocation = easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomAllocation;

namespace easyJet.Holidays.External.Atcom.Tests.Services.Search;

public class SearchOffersServiceTests
{
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

    private readonly SearchOffersService sut;

    private readonly IFixture _fixture;

    public SearchOffersServiceTests()
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
                Search = "{0}",
                SearchRoomVariants = "search_rooms_tmpl&{0}",
                BrandParam = "brnd={0}",
                NRefParam = "nref={0}"
            },
            RoomSystemsSettings = new RoomSystemsSettings
            {
                SystemToDiscard = "HB3"
            },
            Transfers = new TransfersSettings()
        });

        _cacheSettings = Options.Create(new CacheSettings
        {
            Buckets = new Buckets
            {
                SearchCache = "SearchCache"
            }
        });

        _fixture = FixtureUtils.AutoMoqFixture();
        _fixture.Inject(_atcomSettings);

        sut = new SearchOffersService(
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
    }

    [Theory]
    [InlineData(true, 5000d, 500d, "PP")]
    [InlineData(false, 5000d, 500d, "TP")]
    [InlineData(true, null, 500d, "PP")]
    [InlineData(true, null, null, "PP")]
    public async Task DoSearch_EnrichPriceLimit(bool isPerPerson, double? maxPrice, double? minPrice, string priceType)
    {
        var priceLimitSettings = new PriceLimitSettings
        {
            IsPricePerPerson = isPerPerson,
            MaxPrice = maxPrice,
            MinPrice = minPrice
        };


        _referenceDataService
            .Setup(x => x.GetPriceLimit())
            .ReturnsAsync(priceLimitSettings);

        var result = await sut.DoSearch(new SearchAvailablePackagesRequest(), "UK");

        _apiService
            .Verify(x => x
                .GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.Is<SearchAvailablePackagesRequest>(y => VerifyPriceCondition(y, maxPrice, minPrice, priceType))
                ));
    }

    [Theory]
    [InlineData("Brand_1")]
    [InlineData("Brand_999")]
    [InlineData("")]
    [InlineData(null)]
    public async Task DoSearch_AddMarketBrandParam(string? brandParameter)
    {
        var market = new MarketSettings
        {
            AtcomBrandCode = brandParameter
        };

        _referenceDataService
            .Setup(x => x.GetPriceLimit())
            .ReturnsAsync(new PriceLimitSettings());

        _marketService
            .Setup(x => x.GetMarket("UK"))
            .Returns(() => market);

        var result = await sut.DoSearch(new SearchAvailablePackagesRequest(), "UK");

        _apiService
            .Verify(x => x
                .GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.Is<SearchAvailablePackagesRequest>(y => y.QueryParams.Contains(brandParameter != null ? $"brnd={brandParameter}" : ""))
                ));
    }

    [Fact]
    public async Task DoSearch_AddEndpoint()
    {
        var result = await sut.DoSearch(new SearchAvailablePackagesRequest(), "UK");

        _apiService
            .Verify(x => x
                .GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.Is<SearchAvailablePackagesRequest>(y => !string.IsNullOrEmpty(y.Endpoint.ToString()))
                ));
    }

    [Theory]
    [MemberData(nameof(MergeOffersForSameHotel_HappyPathTestData))]
    public void MergeOffersForSameHotel_HappyPathAsync(string[] groupBoards,
        KeyValuePair<string, string>[] boardsCompare,
        AvCacheResultOffersOfferBoard[] altBoardsToCreate,
        AvCacheResultOffersOffer[] offers,
        AvCacheResultOffersOffer expectedResult)
    {
        var dynamic = offers.First(o => o.GetSystem() == "TGX");
        var direct = offers.First(o => o.GetSystem() == null);


        if (dynamic.AltBoard is not null &&
            dynamic.AltBoard.ToList().Exists(ab => ab.Code == direct.GetSelectedBoardCode()))
        {
            _boardService
                .Setup(bs => bs.AnyAlternateBoardsContainBoardCode(dynamic.AltBoard, direct.GetSelectedBoardCode()))
                .Returns(true);

            _boardService.Setup(bs => bs.SelectBoard(dynamic, direct.GetSelectedBoardCode()));
        }

        boardsCompare.ToList().ForEach( bc  =>
        {
            _boardService
                .Setup(bs => bs.BoardCodesAreEqual(bc.Key, bc.Value))
                .Returns(bc.Key.Equals(bc.Value, StringComparison.Ordinal));
        });

        altBoardsToCreate.ToList().ForEach(b =>
            _boardService.Setup(bs => bs.GetSelectedBoard(It.IsAny<AvCacheResultOffersOffer>()))
            .Returns(b));

        groupBoards.ToList().ForEach(o => _boardService.Setup(bs => bs.GetBoardGroupOrCode(o)).Returns(o));

        // Act
        var (mergedOffer, _) = sut.MergeOffersForSameHotel(offers);

        // Assert
        mergedOffer.Should().BeEquivalentTo(expectedResult);

        _boardService.Verify();
    }

    public static TheoryData<string[],
        KeyValuePair<string, string>[],
        AvCacheResultOffersOfferBoard[],
        AvCacheResultOffersOffer[],
        AvCacheResultOffersOffer> MergeOffersForSameHotel_HappyPathTestData() => new()
        {
            // tgxOffer default board = static offer default board + directOffer.Price < tgxOffer.Price 
            {
                ["HB", "FB", "AI" ],
                [ KeyValuePair.Create("HB", "HB") ],
                [new()],
                [
                    CreateOffer("Z0052198", "TGX", 1700, "HB",
                    [
                        CreateBoard("AI", 2100, "Z0052198", "TGX"),
                        CreateBoard("FB", 1800, "Z0052198", "TGX")
                    ]),
                    CreateOffer("ESCB0034", null, 1500, "HB",
                    [
                        CreateBoard("AI", 1800, "ESCB0034"),
                        CreateBoard("FB", 1600, "ESCB0034")
                    ])
                ],
                CreateOffer("ESCB0034", null, 1500, "HB",
                    [
                        CreateBoard("FB", 1600, "ESCB0034"),
                        CreateBoard("AI", 1800, "ESCB0034")
                    ],
                    "Z0052198")
            },
            // tgxOffer default board = static offer default board + directOffer.Price > tgxOffer.Price
            {
                ["HB", "AI" ],
                [KeyValuePair.Create("HB", "HB")],
                [new()],
                [
                    CreateOffer("ESFU0003", null, 2600, "HB", [CreateBoard("AI", 2900, "ESFU0003")]),
                    CreateOffer("Z0002606", "TGX", 2300, "HB")
                ],
                CreateOffer("Z0002606", "TGX", 2300, "HB", [CreateBoard("AI", 2900, "ESFU0003")], "ESFU0003")
            },
            // tgxOffer default board != static offer default board + tgxOffer - no static default board in altboards + directOffer.Price < tgxOffer.Price 
            {
                ["BB", "HB"],
                [ KeyValuePair.Create("HB", "BB") ],
                [new AvCacheResultOffersOfferBoard{Price = 1900, Code = "BB", System = "TGX", AccommodationId = "Z0003452"}],
                [
                    CreateOffer("ESMJ0013", null, 1700, "HB"),
                    CreateOffer("Z0003452", "TGX", 1900, "BB")
                ],
                CreateOffer("ESMJ0013", null, 1700, "HB", [CreateBoard("BB", 1900, "Z0003452", "TGX")], "Z0003452")
            },
            // tgxOffer default board != static offer default board + tgxOffer - no static default board in altboards + directOffer.Price > tgxOffer.Price 
            {
                ["RO", "SC"],
                [KeyValuePair.Create("RO", "SC")],
                [new AvCacheResultOffersOfferBoard{Price = 1200, Code = "RO", System = "TGX", AccommodationId = "Z0298338"}],
                [
                    CreateOffer("Z0298338", "TGX", 1200, "RO"),
                    CreateOffer("GRSK0037", null, 1400, "SC")
                ],
                CreateOffer("GRSK0037", null, 1400, "SC", [CreateBoard("RO", 1200, "Z0298338", "TGX")], "Z0298338")
            },
            // tgxOffer default board != static offer default board + tgxOffer - has static default board in altboards + directOffer.Price < tgxOffer.Price
            {
                ["HB", "BB"],
                [KeyValuePair.Create("BB", "HB")],
                [new AvCacheResultOffersOfferBoard{Price = 3400, Code = "HB", System = "TGX", AccommodationId = "Z0013559"}],
                [
                    CreateOffer("GRHA0002", null, 3600, "BB", [CreateBoard("HB", 4200, "GRHA0002")]),
                    CreateOffer("Z0013559", "TGX", 3400, "HB", [CreateBoard("BB", 3700, "Z0013559", "TGX")])
                ],
                CreateOffer("GRHA0002", null, 3600, "BB", [CreateBoard("HB", 3400, "Z0013559", "TGX")], "Z0013559")
            },
            // tgxOffer default board != static offer default board + tgxOffer - has static default board in altboards  + directOffer.Price > tgxOffer.Price 
            // this will no longer pass because of mocked BoardService.SelectBoard
            /*{
                true,
                ["BB", "HB", "AI"],
                [KeyValuePair.Create("BB", "HB"), KeyValuePair.Create("HB", "HB")],
                [new AvCacheResultOffersOfferBoard{Price = 1400, Code = "BB", System = "TGX", AccommodationId = "Z0003656" }],
                [
                    CreateOffer("Z0003656", "TGX", 1300, "BB",
                    [
                        CreateBoard("AI", 1800, "Z0003656", "TGX"),
                        CreateBoard("HB", 1400, "Z0003656", "TGX")
                    ]),
                    CreateOffer("ESTF0103", null, 1500, "HB",
                    [
                        CreateBoard("AI", 1900, "ESTF0103")
                    ])
                ],
                CreateOffer("Z0003656", "TGX", 1400, "HB", 
                    [ 
                        CreateBoard("BB", 1300, "Z0003656", "TGX"),
                        CreateBoard("AI", 1800, "Z0003656", "TGX") 
                    ], "ESTF0103")
            },*/
            // 2 rooms, 
            {
                ["AI", "HB"],
                [KeyValuePair.Create("AI", "HB"), KeyValuePair.Create("AI", "AI") ],
                [new AvCacheResultOffersOfferBoard{Price = 2600, Code = "HB", System = "TGX", AccommodationId = "Z0003240" }],
                [
                    CreateOffer("ESMJ0085", null, 2100, "AI", [CreateBoard("HB", 1900, "ESMJ0085")], units: 2),
                    CreateOffer("Z0003240", "TGX", 2600, "HB", [CreateBoard("AI", 3000, "Z0003240", "TGX")], units: 2)
                ],
                CreateOffer("ESMJ0085", null, 2100, "AI", [CreateBoard("HB", 1900, "ESMJ0085")], "Z0003240", units: 2)
            },
            // tgx default board added as alternative board 
            {
                ["AI", "BB"],
                [KeyValuePair.Create("AI", "BB") ],
                [new AvCacheResultOffersOfferBoard{Price = 1500, Code = "BB", System = "TGX", AccommodationId = "Z0002600" }],
                [
                    CreateOffer("ESFU0013", null, 1500, "AI"),
                    CreateOffer("Z0002600", "TGX", 1500, "BB")
                ],
                CreateOffer("ESFU0013", null, 1500, "AI", [CreateBoard("BB", 1500, "Z0002600", "TGX")], "Z0002600")
            },
            // cheapest versions of alternative boards are selected from both offers
            // this will no longer pass because of mocked BoardService.SelectBoard
            /*{
                ["HB","AI", "AS", "FB", "BB"],
                [KeyValuePair.Create("HB", "HB")],
                [new()],
                [
                    CreateOffer("ESCD0032", null, 1290, "HB",
                    [
                        CreateBoard("FB", 1410, "ESCD0032"),
                        CreateBoard("AI", 1610, "ESCD0032"),
                        CreateBoard("AS", 1820, "ESCD0032")
                    ]),
                    CreateOffer("Z0008477", "TGX", 1250, "BB",
                    [
                        CreateBoard("HB", 1300, "Z0008477", "TGX"),
                        CreateBoard("FB", 1420, "Z0008477", "TGX"),
                        CreateBoard("AI", 1590, "Z0008477", "TGX")
                    ])
                ],
                CreateOffer("ESCD0032", null, 1290, "HB",
                [
                    CreateBoard("BB", 1250, "Z0008477", "TGX"),
                    CreateBoard("FB", 1410, "ESCD0032"),
                    CreateBoard("AI", 1590, "Z0008477", "TGX"),
                    CreateBoard("AS", 1820, "ESCD0032")
                ], "Z0008477")
            }*/
        };

    [Theory]
    [MemberData(nameof(MergeOffersForSameHotel_SadPathTestData))]
    public void MergeOffersForSameHotel_SadPath(IList<AvCacheResultOffersOffer> offers)
    {
        // Act
        var (mergedOffer, errorMessage) = sut.MergeOffersForSameHotel(offers);

        // Assert
        mergedOffer.Should().BeNull();
        errorMessage.Should().NotBeNullOrEmpty();
    }

    public static TheoryData<IList<AvCacheResultOffersOffer>> MergeOffersForSameHotel_SadPathTestData => new()
        {
            {
                // 2 direct offers
                new List<AvCacheResultOffersOffer>
                {
                    CreateOffer("ESMJ0027", null, 1700, "HB"),
                    CreateOffer("ESMJ0039", null, 1500, "HB")
                }
            },
            {
                // 2 tgx offers
                new List<AvCacheResultOffersOffer>
                {
                    CreateOffer("Z0050041", "TGX", 1700, "HB"),
                    CreateOffer("Z0050042", "TGX", 1500, "HB")
                }
            },
            {
                // direct offer + 2 tgx offers
                new List<AvCacheResultOffersOffer>
                {
                    CreateOffer("ESMJ0178", null, 1700, "HB"),
                    CreateOffer("Z0050041", "TGX", 1700, "HB"),
                    CreateOffer("Z0050042", "TGX", 1500, "HB")
                }
            }
        };

    public static AvCacheResultOffersOfferBoard CreateBoard(string boardCode, decimal price, string? accomCode = null, string? system = null)
    {
        return new AvCacheResultOffersOfferBoard()
        {
            AccommodationId = accomCode,
            Code = boardCode,
            Price = price,
            System = system
        };
    }

    public static AvCacheResultOffersOfferAccomUnit CreateUnit(string unitBoard, string? system = null)
    {
        return new AvCacheResultOffersOfferAccomUnit()
        {
            Board = unitBoard,
            SrcInfo = system != null ?
                new AvCacheResultOffersOfferAccomUnitSrcInfo
                {
                    System = system,
                } :
                null
        };
    }

    public static AvCacheResultOffersOffer CreateOffer(string accomCode, string? system, decimal price, string unitBoard,
        AvCacheResultOffersOfferBoard[]? alternativeBoards = null, string? altAccomCode = null, int units = 1)
    {
        return new AvCacheResultOffersOffer
        {
            Accom = [
                new AvCacheResultOffersOfferAccom()
                {
                    Code = accomCode,
                    Unit = Enumerable.Repeat(0, units).Select(_ => CreateUnit(unitBoard, system)).ToArray()
                } ],
            AltBoard = alternativeBoards ?? Enumerable.Empty<AvCacheResultOffersOfferBoard>().ToArray(),
            Price = price,
            PricePP = price / 2,
            AlternativeAccommodations = altAccomCode != null ?
                        new List<AlternativeAccommodation> { new AlternativeAccommodation { Code = altAccomCode } } : null
        };
    }

    private static bool VerifyPriceCondition(SearchAvailablePackagesRequest request, double? maxPrice, double? minPrice, string priceType)
    {
        return request.MaxPrice == maxPrice && request.MinPrice == minPrice && request.PriceType == priceType;
    }

    [Fact]
    public async Task DoSearch_ByPackagesRequest_AddsPromoCacheBustingAndSetsFromCacheFlag()
    {
        var request = CreatePackagesSearchRequest();
        request.IsPromo = true;

        _settingsService
            .Setup(x => x.GetPromoCacheBustingSetting())
            .ReturnsAsync(new PromoCacheBustingSetting { QueryValue = "ver-1" });

        _referenceDataService
            .Setup(x => x.GetPriceLimit())
            .ReturnsAsync(new PriceLimitSettings());

        _marketService
            .Setup(x => x.GetMarket(It.IsAny<string>()))
            .Returns(() => new MarketSettings());

        _cacheService
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<SearchAvailablePackagesResponse>>>(),
                false))
            .Returns<string, ICollection<string>, Func<Task<SearchAvailablePackagesResponse>>, bool>((_, _, getData, _) => getData());

        _apiService
            .Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                It.IsAny<SearchAvailablePackagesRequest>()))
            .ReturnsAsync(CreateSearchResponse(CreateOffer("ES1", null, 1000, "HB")));

        var result = await sut.DoSearch(request);
        var fromCache = result.Item2;

        fromCache.Should().BeFalse();
        _apiService.Verify(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
            It.Is<SearchAvailablePackagesRequest>(r => r.PromoCacheBusting == "ver-1")), Times.Once);
    }

    [Fact]
    public async Task DoSearch_WithRoomAllocation_RemovesOffersWithZeroAdults()
    {
        var baseRequest = new PackagesSearchRequest
        {
            MarketCode = "UK",
            Room = [new RoomAllocation { Adults = 2 }],
            Geography = "ES",
            Departure = "LGW",
            StartDate = "2025-01-01",
            Duration = [7]
        };

        var searchRequest = new SearchAvailablePackagesRequest();
        searchRequest.SetQueryString("{0}");

        _referenceDataService
            .Setup(x => x.GetPriceLimit())
            .ReturnsAsync(new PriceLimitSettings());

        _marketService
            .Setup(x => x.GetMarket(It.IsAny<string>()))
            .Returns(() => new MarketSettings());

        _apiService
            .Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                It.IsAny<SearchAvailablePackagesRequest>()))
            .ReturnsAsync(CreateSearchResponse(
                CreateOfferWithAdults("ES1", null, 1000, "HB", 2),
                CreateOfferWithAdults("ES2", null, 900, "HB", 0)));

        var result = await sut.DoSearch(baseRequest, searchRequest, withRoomAllocation: true);

        result.Payload?.Body?.Result?.Offers?.Offer.Should().HaveCount(1);
        result.Payload?.Body?.Result?.Offers?.Offer.Single().Accom.First().Code.Should().Be("ES1");
    }

    [Fact]
    public async Task DoSearch_GroupsByGiata_AndDiscardsConfiguredSystem()
    {
        var searchRequest = new SearchAvailablePackagesRequest();
        searchRequest.SetQueryString("s_tp=3");

        _referenceDataService
            .Setup(x => x.GetPriceLimit())
            .ReturnsAsync(new PriceLimitSettings());

        _referenceDataService
            .Setup(x => x.GetAccommodationToGiataMappings(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(new Dictionary<string, string>
            {
                { "ES1", "G1" },
                { "ES2", "G1" }
            });

        _marketService
            .Setup(x => x.GetMarket(It.IsAny<string>()))
            .Returns(new MarketSettings());

        _apiService
            .Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                It.IsAny<SearchAvailablePackagesRequest>()))
            .ReturnsAsync(CreateSearchResponse(
                CreateOffer("ES1", "HB3", 1000, "HB"),
                CreateOffer("ES2", "TGX", 900, "HB")));

        var result = await sut.DoSearch(searchRequest, "UK");

        result.Payload?.Body?.Result?.Offers?.Offer.Should().HaveCount(1);
        result.Payload?.Body?.Result?.Offers?.Offer.Single().Accom.First().Code.Should().Be("ES2");
    }

    [Fact]
    public async Task DoSearch_AddsNRef_WhenFphAndRequiredSearchTypesPresent()
    {
        var searchRequest = new SearchAvailablePackagesRequest();
        searchRequest.AddQueryString("s_tp=3");
        searchRequest.AddQueryString("s_tp=6");
        searchRequest.AddQueryString("s_tp=4");
        SearchAvailablePackagesRequest? capturedRequest = null;

        _referenceDataService
            .Setup(x => x.GetPriceLimit())
            .ReturnsAsync(new PriceLimitSettings());

        _marketService
            .Setup(x => x.GetMarket(It.IsAny<string>()))
            .Returns(new MarketSettings());

        _apiService
            .Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                It.IsAny<SearchAvailablePackagesRequest>()))
            .Callback<SearchAvailablePackagesRequest>(r => capturedRequest = r)
            .ReturnsAsync(CreateSearchResponse());

        await sut.DoSearch(searchRequest, "UK", "fph");

        capturedRequest.Should().NotBeNull();
        capturedRequest!.QueryParams.Should().Contain("nref=Y");
    }

    private static SearchAvailablePackagesResponse CreateSearchResponse(params AvCacheResultOffersOffer[] offers)
    {
        return new SearchAvailablePackagesResponse
        {
            Payload = new XmlApiPayload<AvCache>
            {
                Body = new AvCache
                {
                    Result = new AvCacheResult
                    {
                        Offers = new AvCacheResultOffers
                        {
                            Offer = offers
                        }
                    }
                }
            }
        };
    }

    private static AvCacheResultOffersOffer CreateOfferWithAdults(string accomCode, string? system, decimal price, string unitBoard, byte adults)
    {
        var offer = CreateOffer(accomCode, system, price, unitBoard);
        offer.Accom[0].Unit[0].Occ = new AvCacheResultOffersOfferAccomUnitOcc
        {
            Ad = adults
        };

        return offer;
    }

    private static PackagesSearchRequest CreatePackagesSearchRequest()
    {
        return new PackagesSearchRequest
        {
            StartDate = "2025-01-01",
            Duration = [7],
            FlexibleDays = 0,
            Departure = "LGW",
            Geography = "ES",
            Room = [new RoomAllocation { Adults = 2 }],
            MarketCode = "UK",
            AutomaticAllocation = true
        };
    }
}