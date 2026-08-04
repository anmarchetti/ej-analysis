using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Excursions;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Models.Destinations.Info;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Cms.Tests.Services
{
    public class ExposedDestinationsSearchService : DestinationsSearchService
    {

        public ExposedDestinationsSearchService(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            ILogger<DestinationsSearchService> logger,
            IOptions<AtcomSettings> atcomSettings,
            ICacheService cacheService,
            IOptions<CacheSettings> cacheSettings,
            IOptions<CmsSettings> cmsSettings,
            ILanguageService languageService)
            : base(apiService, endpointsProvider, httpContextAccessor, logger, atcomSettings, cacheService, cacheSettings, cmsSettings, languageService)
        {
        }

        /// <summary>
        /// Exposed FindPerfectMatch method
        /// </summary>
        /// <param name="airportCodes"></param>
        /// <param name="matchingDestinations"></param>
        /// <returns></returns>
        public DestinationsMappingResponse FindPerfectMatch(IEnumerable<DestinationItem> matchingDestinations)
        {
            return base.MapToDestinationResponse(matchingDestinations);
        }
    }

    public class DestinationsSearchServiceTest
    {
        private readonly ExposedDestinationsSearchService exposedDestinationsSearchService;
        private readonly IOptions<CacheSettings> cacheSettings;
        private readonly Mock<ICacheService> cacheService;
        private readonly IFixture _fixture;

        public DestinationsSearchServiceTest()
        {

            _fixture = FixtureUtils.AutoMoqFixture();

            cacheSettings = Options.Create(new CacheSettings
            {
                Buckets = new Buckets
                {
                    SearchCache = "SearchCache"
                }
            });


            cacheService = _fixture.Freeze<Mock<ICacheService>>();

            exposedDestinationsSearchService = new ExposedDestinationsSearchService(
                null,
                null,
                null,
                null,
                Options.Create(new AtcomSettings()),
                cacheService.Object,
                cacheSettings,
                Options.Create(new CmsSettings()),
                null);


        }

        [Fact]
        public void WhenRunFindPerfectMatch_VirtualCountryWithOneUniqueResort_ShouldReturnOnlyResortWithParents()
        {
            //it there are virtual countries, we use specific logic
            //we need to additionally get resorts
            var matchingDestinations = new List<DestinationItem>
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualCountry,
                    Code = "VGBEN"
                },
                new DestinationItem
                {
                    Type = DestinationItemType.Country,
                    Code = "GB",
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "GBENLP",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "GBEN"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "GB"
                        }
                    }
                }
            };

            // Act
            var actual = exposedDestinationsSearchService.FindPerfectMatch(matchingDestinations);

            // Assert
            actual.Should().NotBeNull();

            actual.Resorts.Should().BeEquivalentTo("GBENLP");
            actual.Regions.Should().BeEquivalentTo("GBEN");
            actual.Countries.Should().BeEquivalentTo("GB");
        }

        [Fact]
        public void WhenRunFindPerfectMatch_VirtualCountryAndResortsBelongToOneRegion_ShouldReturnOnlyRegionWithParents()
        {
            var matchingDestinations = new List<DestinationItem>
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualCountry,
                    Code = "VGBSC"
                },
                new DestinationItem
                {
                    Type = DestinationItemType.Country,
                    Code = "GB",
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "GBSCIN",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "GBSC"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "GB"
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "GBSCGL",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "GBSC"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "GB"
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "GBSCED",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "GBSC"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "GB"
                        }
                    }
                },
            };

            // Act
            var actual = exposedDestinationsSearchService.FindPerfectMatch(matchingDestinations);

            // Assert
            actual.Should().NotBeNull();

            //resorts combined into region
            actual.Resorts.Should().BeEmpty();

            actual.Countries.Should().BeEquivalentTo("GB");
            actual.Regions.Should().BeEquivalentTo("GBSC");
        }

        [Fact]
        public void WhenRunFindPerfectMatch_CountryWithRegions_ShouldIgnoreResorts()
        {
            var matchingDestinations = new List<DestinationItem>
            {
                new DestinationItem
                {
                    Type = DestinationItemType.Country,
                    Code = "ES",
                },
                new DestinationItem
                {
                    Type = DestinationItemType.Region,
                    Code = "ESMJ",
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESMJPN",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "ESMJ"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "ES"
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESMJCL",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "ESMJ"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "ES"
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESMJCN",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "ESMJ"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "ES"
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESMJCM",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "ESMJ"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "ES"
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESMJFX",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "ESMJ"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "ES"
                        }
                    }
                },
            };


            // Act
            var actual = exposedDestinationsSearchService.FindPerfectMatch(matchingDestinations);

            // Assert
            actual.Should().NotBeNull();

            //ignore resorts if there only real countries
            actual.Resorts.Should().BeEmpty();

            actual.Countries.Should().BeEquivalentTo("ES");
            actual.Regions.Should().BeEquivalentTo("ESMJ");
        }

        [Fact]
        public void WhenRunFindPerfectMatch_CountryWithRegionsVirtualCountryWithResort_ShouldIgnoreResortsForCountryAndKeepResortForVirtualCountry()
        {
            var matchingDestinations = new List<DestinationItem>
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualCountry,
                    Code = "VGBEN"
                },
                new DestinationItem
                {
                    Type = DestinationItemType.Country,
                    Code = "GB",
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "GBENLP",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "GBEN"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "GB"
                        }
                    }
                },
                new DestinationItem
                {
                    Type = DestinationItemType.Country,
                    Code = "ES",
                },
                new DestinationItem
                {
                    Type = DestinationItemType.Region,
                    Code = "ESMJ",
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESMJPN",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "ESMJ"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "ES"
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESMJCL",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "ESMJ"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "ES"
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESMJCN",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "ESMJ"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "ES"
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESMJCM",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "ESMJ"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "ES"
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESMJFX",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "ESMJ"
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "ES"
                        }
                    }
                },
            };


            // Act
            var actual = exposedDestinationsSearchService.FindPerfectMatch(matchingDestinations);

            // Assert
            actual.Should().NotBeNull();

            //1 resorts for virtual country
            actual.Countries.Should().BeEquivalentTo("GB", "ES");
            actual.Regions.Should().BeEquivalentTo("ESMJ", "GBEN");
            actual.Resorts.Should().BeEquivalentTo("GBENLP");
        }

        [Theory]
        [MemberData(nameof(DestinationItemsData))]
        public async Task GetPromoDestinations_RecievedDestinationsFromCms_ReturnDestinations(IEnumerable<DestinationItem> destinationItems)
        {
            //Arrange
            cacheService.Setup(service =>
                    service.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<IEnumerable<DestinationItem>>>>(), false))
                .ReturnsAsync(destinationItems);


            //Act
            var actual = await exposedDestinationsSearchService.GetPromoDestinations(It.IsAny<string>());

            //Assert
            actual.Should().NotBeNull();
            actual.Should().BeEquivalentTo(destinationItems);
        }

        [Fact]
        public async Task GetPromoDestinations_NotRecievedDestinationsFromCms_ReturnsEmptyDestinationsCollection()
        {
            //Arrange
            cacheService.Setup(service =>
                    service.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<IEnumerable<DestinationItem>>>>(), false))
                .ReturnsAsync(default(IEnumerable<DestinationItem>));


            //Act
            var actual = await exposedDestinationsSearchService.GetPromoDestinations(It.IsAny<string>());

            //Assert
            actual.Should().NotBeNull();
            actual.Should().BeEmpty();
        }

        [Theory]
        [MemberData(nameof(ExcursionMapItemsData))]
        public async Task GetExcursionMap_RecievedExcursionMapFromCms_ReturnsExcursionMap(ExcursionsMap excursionMap)
        {
            //Arrange
            cacheService.Setup(service =>
                    service.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<ExcursionsMap>>>(), false))
                .ReturnsAsync(excursionMap);


            //Act
            var actual = await exposedDestinationsSearchService.GetExcursionMap(It.IsAny<string>());

            //Assert
            actual.Should().NotBeNull();
            actual.Should().BeEquivalentTo(excursionMap);
        }

        [Fact]
        public async Task GetDestinationInfo_ReturnsDestinationInfo()
        {
            var cmsSettings = Options.Create(new CmsSettings
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            });

            _fixture.Inject(cmsSettings);

            var apiServiceMock = _fixture.Freeze<Mock<IApiService>>();
            apiServiceMock
                .Setup(x => x.GetResponseContentAsync<DestinationInfoRequest, DestinationInfoResponse>(It.IsAny<DestinationInfoRequest>()))
                .ReturnsAsync(new DestinationInfoResponse
                {
                    Payload = new JsonApiPayload<DestinationInfo>
                    {
                        Body = new DestinationInfo
                        {

                            Code = "ITLG",
                            Description = "Description",
                            ImageUrl = new Uri("/image-01", UriKind.Relative),
                            Url = new Uri("/lake-como", UriKind.Relative),
                            Name = "Lake Como"
                        }
                    },
                });

            var sut = _fixture.Create<DestinationsSearchService>();

            var result = await sut.GetDestinationInfo("ITLG");
            result.Should().NotBeNull();
            result.Code.Should().Be("ITLG");
        }

        public static TheoryData<IEnumerable<DestinationItem>> DestinationItemsData =>
            new TheoryData<IEnumerable<DestinationItem>>
            {
                new List<DestinationItem>()
                {
                    new DestinationItem
                    {
                        Type = DestinationItemType.Hotel,
                        AirportCodes = new[]
                        {
                            "PMI",
                            "EL0"
                        },
                        Code = "HOT001",
                        Parents = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Type = DestinationItemType.Resort,
                                Code = "RES001",
                                Name = "Resort 001"
                            },
                            new DestinationItem
                            {
                                Type = DestinationItemType.Region,
                                Code = "REG001",
                                Name = "Region 001"
                            },
                            new DestinationItem
                            {
                                Type = DestinationItemType.Country,
                                Code = "ES",
                                Name = "Spain 001"
                            }
                        }
                    },
                    new DestinationItem
                    {
                        Type = DestinationItemType.Hotel,
                        AirportCodes = new[]
                        {
                            "ZBC",
                            "TXH",
                            "EL1"
                        },
                        Code = "HOT002",
                        Parents = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Type = DestinationItemType.Resort,
                                Code = "RES001",
                                Name = "Resort 001"
                            },
                            new DestinationItem
                            {
                                Type = DestinationItemType.Region,
                                Code = "REG001",
                                Name = "Region 001"
                            },
                            new DestinationItem
                            {
                                Type = DestinationItemType.Country,
                                Code = "ES",
                                Name = "Spain 001"
                            }
                        }
                    },
                    new DestinationItem
                    {
                        Type = DestinationItemType.Resort,
                        Code = "RES001",
                        Name = "Resort 001",
                        AirportCodes = new[]
                        {
                            "PMI",
                            "EL0",
                            "ZBC",
                            "TXH",
                            "EL1"
                        },
                        Parents = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Type = DestinationItemType.Region,
                                Code = "REG001",
                                Name = "Region 001"
                            },
                            new DestinationItem
                            {
                                Type = DestinationItemType.Country,
                                Code = "ES",
                                Name = "Spain 001"
                            }
                        },
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Type = DestinationItemType.Hotel,
                                Code = "HOT001"
                            },
                            new DestinationItem
                            {
                                Type = DestinationItemType.Hotel,
                                Code = "HOT002"
                            },
                            new DestinationItem
                            {
                                Type = DestinationItemType.Hotel,
                                Code = "HOT003"
                            }
                        }
                    },
                    new DestinationItem
                    {
                        Type = DestinationItemType.Region,
                        Code = "REG001",
                        Name = "Region 001",
                        AirportCodes = new[]
                        {
                            "PMI",
                            "EL0",
                            "ZBC",
                            "TXH",
                            "EL1",
                            "EL2",
                            "EL3",
                        },
                        Parents = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Type = DestinationItemType.Country,
                                Code = "ES",
                                Name = "Spain 001"
                            }
                        },
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Type = DestinationItemType.Resort,
                                Code = "RES001",
                                Name = "Resort 001"
                            },
                            new DestinationItem
                            {
                                Type = DestinationItemType.Resort,
                                Code = "RES002",
                                Name = "Resort 002"
                            }
                        }
                    },
                    new DestinationItem
                    {
                        Type = DestinationItemType.Country,
                        Code = "ES",
                        Name = "Spain 001",
                        AirportCodes = new[]
                        {
                            "PMI",
                            "EL0",
                            "ZBC",
                            "TXH",
                            "EL1",
                            "EL2",
                            "EL3",
                            "EL11",
                            "EL12",
                            "EL13",
                        },
                        Parents = new List<DestinationItem>
                        {
                        },
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Type = DestinationItemType.Region,
                                Code = "REG001",
                                Name = "Region 001"

                            },
                            new DestinationItem
                            {
                                Type = DestinationItemType.Region,
                                Code = "REG002",
                                Name = "Region 002"

                            }
                        }
                    }
                }
            };

        public static TheoryData<ExcursionsMap> ExcursionMapItemsData =>
            new TheoryData<ExcursionsMap>
            {
               new ExcursionsMap
               {
                   Type = DestinationItemType.Region,
                   MusementIds = new[] {"82", "61"}
               }
            };
    }
}
