using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.Domain.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.Search;

// TODO: rename this to SearchOffersServiceTests and SearchOffersServiceTests to OffersServiceTests raise PR against develop. not doing it on feature branch, since already had weird conflicts with develop after renaming
public class ApiSearchOffersServiceTests
{
    private SearchOffersService _sut;
    private readonly Mock<IReferenceDataService> _referenceDataService;
    private readonly Mock<IBoardService> _boardService;
    private readonly Mock<ILogger<SearchOffersService>> _logger;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessor;
    private readonly Mock<ISettingsService> _settingsService;
    private readonly Mock<ICacheService> _cacheService;
    private readonly Mock<IApiService> _apiService;
    private readonly Mock<IMarketService> _marketService;

    public ApiSearchOffersServiceTests()
    {
        _apiService = new Mock<IApiService>();
        var atcomOptions = new OptionsWrapper<AtcomSettings>(new AtcomSettings
        {
            Booking = new AtcomApiSettings
            {
                Host = "https://atcom-api.com",
                BaseUrl = "/EZYTST/booking"
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
            RoomSystemsSettings = new RoomSystemsSettings
            {
                Priorities = new Dictionary<string, int>
                {
                    { "TGX", 0 },
                    { "Static", 1 }
                },
                SystemToDiscard = "HB3"
            },
            EndpointTemplate = new AtcomEndpointTemplateSettings
            {
                BrandParam = "brnd={0}"
            }
        });
        var endpointsProvider = new EndpointsProvider(atcomOptions,
            new OptionsWrapper<EnvironmentBehaviourSettings>(new EnvironmentBehaviourSettings()),
            new Mock<ICookiesService>().Object, new Mock<ILogger<EndpointsProvider>>().Object);
        var searchOptions = new OptionsWrapper<SearchSettings>(new SearchSettings());
        var cacheOptions = new OptionsWrapper<CacheSettings>(new CacheSettings());
        var smartSeerOptions = new OptionsWrapper<SmartSeerSettings>(new SmartSeerSettings());

        var searchRequestsMapper = new SearchRequestsMapper(searchOptions, smartSeerOptions, atcomOptions);
        _cacheService = new Mock<ICacheService>();
        _settingsService = new Mock<ISettingsService>();
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _logger = new Mock<ILogger<SearchOffersService>>();
        _referenceDataService = new Mock<IReferenceDataService>();
        _boardService = new Mock<IBoardService>();

        _marketService = new Mock<IMarketService>();
        _marketService
            .Setup(x => x.GetCurrentMarket())
            .Returns(new MarketSettings
            {
                AtcomBrandCode = "WAGBP"
            });

        _sut = new SearchOffersService(_boardService.Object, _apiService.Object, endpointsProvider, searchRequestsMapper,
            _cacheService.Object, atcomOptions, cacheOptions, _settingsService.Object, _httpContextAccessor.Object,
            _marketService.Object, _logger.Object, _referenceDataService.Object);
    }

    [Fact]
    public async Task SearchOffers_ShouldMergeOffers()
    {
        // Arrange
        var searchRequest = new SearchAvailablePackagesRequest();
        searchRequest.AddQueryString("s_tp=3");

        ConfigureSearchPackageResponse(new[]
        {
            new OfferConfig
            {
                Price = 100,
                AccomCode = "AT001",
                PackageId = "packageId1",
            },
            new OfferConfig
            {
                Price = 50,
                AccomCode = "AT002",
                PackageId = "packageId2",
                System = "TGX"
            }
        });

        _referenceDataService.Setup(x => x.GetAccommodationToGiataMappings(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(() => new Dictionary<string, string>()
            {
                {"AT001", "11111"},
                {"AT002", "11111"},
            });

        _boardService.Setup(bs => bs.BoardCodesAreEqual(It.IsAny<string>(), It.IsAny<string>())).Returns(true);

        // Act
        var response = await _sut.DoSearch(new PackagesSearchRequest(), searchRequest);

        // Assert
        var offers = response.Payload.Body.Result.Offers.Offer;
        offers.Length.Should().Be(1);
        offers[0].Accom[0].Code.Should().Be("AT002");
        offers[0].Accom[0].AtcomId.Should().Be("packageId2");
        offers[0].AlternativeAccommodations[0].Code.Should().Be("AT001");
        offers[0].AlternativeAccommodations[0].PackageId.Should().Be("packageId1");
    }

    [Fact]
    public async Task SearchOffers_ShouldReturn2SeparateOffers()
    {
        // Arrange
        var searchRequest = new SearchAvailablePackagesRequest();
        searchRequest.AddQueryString("s_tp=3");

        ConfigureSearchPackageResponse(new[]
        {
            new OfferConfig
            {
                Price = 100,
                AccomCode = "AT001",
                PackageId = "packageId1",
            },
            new OfferConfig
            {
                Price = 50,
                AccomCode = "AT002",
                PackageId = "packageId2",
                System = "TGX"
            }
        });

        _referenceDataService.Setup(x => x.GetAccommodationToGiataMappings(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(() => new Dictionary<string, string>()
            {
                {"AT001", "11111"},
                {"AT002", "22222"},
            });

        // Act
        var response = await _sut.DoSearch(new PackagesSearchRequest(), searchRequest);

        // Assert
        var offers = response.Payload.Body.Result.Offers.Offer;
        offers.Length.Should().Be(2);
        offers[0].Accom[0].Code.Should().Be("AT001");
        offers[0].Accom[0].AtcomId.Should().Be("packageId1");
        offers[1].Accom[0].Code.Should().Be("AT002");
        offers[1].Accom[0].AtcomId.Should().Be("packageId2");
    }

    [Fact]
    public async Task SearchOffers_ShouldExcludeHB3()
    {
        // Arrange
        var searchRequest = new SearchAvailablePackagesRequest();
        searchRequest.AddQueryString("s_tp=3");

        ConfigureSearchPackageResponse(new[]
        {
            new OfferConfig
            {
                Price = 100,
                AccomCode = "AT001",
                PackageId = "packageId1",
            },
            new OfferConfig
            {
                Price = 50,
                AccomCode = "AT002",
                PackageId = "packageId2",
                System = "TGX"
            },
            new OfferConfig
            {
                Price = 25,
                AccomCode = "AT003",
                PackageId = "packageId3",
                System = "HB3"
            }
        });

        _referenceDataService.Setup(x => x.GetAccommodationToGiataMappings(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(() => new Dictionary<string, string>()
            {
                {"AT001", "11111"},
                {"AT002", "11111"},
                {"AT003", "11111"},
            });

        _boardService.Setup(bs => bs.BoardCodesAreEqual(It.IsAny<string>(), It.IsAny<string>())).Returns(true);

        // Act
        var response = await _sut.DoSearch(new PackagesSearchRequest(), searchRequest);

        // Assert
        var offers = response.Payload.Body.Result.Offers.Offer;
        offers.Length.Should().Be(1);
        offers[0].Accom[0].Code.Should().Be("AT002");
        offers[0].Accom[0].AtcomId.Should().Be("packageId2");
        offers[0].AlternativeAccommodations.Should().NotContain(x => x.Code == "AT003" && x.PackageId == "packageId3");
    }

    private class OfferConfig
    {
        public decimal Price { get; set; }
        public string AccomCode { get; set; }
        public string PackageId { get; set; }
        public string System { get; set; }
        public IEnumerable<BoardConfig> Boards { get; set; }
    }

    private class BoardConfig
    {
        public string Code { get; set; }
        public decimal Price { get; set; }
    }

    private void ConfigureSearchPackageResponse(IEnumerable<OfferConfig> offersData)
    {
        var offers = new List<AvCacheResultOffersOffer>();
        foreach (var offerConfig in offersData)
        {
            offers.Add(new AvCacheResultOffersOffer
            {
                Price = offerConfig.Price,
                AltBoard = offerConfig.Boards?.Select(x => new AvCacheResultOffersOfferBoard
                {
                    Code = x.Code,
                    Price = x.Price
                }).ToArray(),
                Accom = new[]
                {
                    new AvCacheResultOffersOfferAccom
                    {
                        Code = offerConfig.AccomCode,
                        AtcomId = offerConfig.PackageId,
                        Unit = new[]
                        {
                            new AvCacheResultOffersOfferAccomUnit
                            {
                                Occ = new AvCacheResultOffersOfferAccomUnitOcc
                                {
                                    Ad = 1
                                },
                                SrcInfo = new AvCacheResultOffersOfferAccomUnitSrcInfo
                                {
                                    System = offerConfig.System
                                }
                            }
                        }
                    }
                }
            });
        }

        _apiService.Setup(x =>
                x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.IsAny<SearchAvailablePackagesRequest>()))
            .ReturnsAsync(() => new SearchAvailablePackagesResponse
            {
                Payload = new XmlApiPayload<AvCache>
                {
                    Body = new AvCache
                    {
                        Result = new AvCacheResult
                        {
                            Offers = new AvCacheResultOffers
                            {
                                Offer = offers.ToArray()
                            }
                        }
                    }
                }
            });
    }
}