using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Excursions;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Serialization;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Models.Destinations.Excursions;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.External.Musement.Models;
using easyJet.Holidays.External.Musement.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using EndpointsProvider = easyJet.Holidays.External.Cms.Services.EndpointsProvider;

namespace easyJet.Holidays.External.Musement.Tests.Services
{
    public class ExcursionServiceTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<ILanguageService> _languageServiceMock;

        private MusementSettings _musementSettings = new()
        {
            Api = new MusementApi
            {
                Host = "https://musement.com",
                Activities = "api/activities",
                Login = "api/login",
                Cities = "api/cities"
            },
            WhiteLabel = new WhiteLabel
            {
                Host = "https://whitelabel.com",
                Search = "{language_code}/search",
                City = "{language_code}/barcelona",
            },
            Take = 5,
            CurrencyHeader = "X-Musement-Currency",
            AcceptLanguageHeader = "Accept-Language",
            HeaderLanguageMap = new Dictionary<string, string> { { "en", "en-GB" } },
            UrlLanguageMap = new Dictionary<string, string> { { "en", "uk" } }
        };

        public ExcursionServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _languageServiceMock = _fixture.Freeze<Mock<ILanguageService>>();
        }

        [Fact]
        public async Task Search_ByCountryCodeMapped_CallDestinationServiceAndExcursionService()
        {
            // Arrange fixture
            var excursionMap = new ExcursionsMap
            {
                Type = DestinationItemType.Country,
                MusementIds = new[] { "IT" }
            };

            var fixture = PrepareFixture(excursionMap, out var apiService, out var destinationService);

            // Arrange
            var request = new ExcursionsRequest
            {
                DestinationCode = "IT"
            };

            var sut = fixture.Create<ExcursionService>();

            // Act
            var result = sut.Search(request);

            // Assert
            apiService
                .Verify(x =>
                    x.GetResponseContentAsync<SearchActivitiesRequest, SearchActivitiesResponse>(It.Is<SearchActivitiesRequest>(x =>
                        x.Take == _musementSettings.Take &&
                        !string.IsNullOrEmpty(x.CountryIn) &&
                        string.IsNullOrEmpty(x.CityIn) &&
                        string.IsNullOrEmpty(x.Coordinates) &&
                        string.IsNullOrEmpty(x.Distance))
                    ), Times.Exactly(1));

            destinationService.Verify(x => x.GetExcursionMap(It.IsAny<string>()), Times.Exactly(1));
        }

        [Fact]
        public async Task Search_ByRegionCodeMapped_CallDestinationServiceAndExcursionService()
        {
            // Arrange fixture
            var excursionMap = new ExcursionsMap
            {
                Type = DestinationItemType.Region,
                MusementIds = new[] { "20", "30" }
            };
            var fixture = PrepareFixture(excursionMap, out var apiService, out var destinationService);

            // Arrange
            var request = new ExcursionsRequest
            {
                DestinationCode = "ESBA"
            };

            var sut = fixture.Create<ExcursionService>();

            // Act
            var result = sut.Search(request);

            // Assert
            apiService
                .Verify(x =>
                    x.GetResponseContentAsync<SearchActivitiesRequest, SearchActivitiesResponse>(
                        It.Is<SearchActivitiesRequest>(x =>
                            x.Take == _musementSettings.Take &&
                            !string.IsNullOrEmpty(x.CityIn) &&
                            string.IsNullOrEmpty(x.CountryIn) &&
                            string.IsNullOrEmpty(x.Coordinates) &&
                            string.IsNullOrEmpty(x.Distance))
                        ),
                    Times.Exactly(1)
                );

            destinationService.Verify(x => x.GetExcursionMap(It.IsAny<string>()), Times.Exactly(1));
        }

        [Fact]
        public async Task Search_ExcursionMapReturnNull_ThrowApiException()
        {
            // Arrange fixture
            ExcursionsMap excursionMap = null;

            var fixture = PrepareFixture(excursionMap, out var apiService, out var destinationService);

            // Arrange
            var request = new ExcursionsRequest
            {
                DestinationCode = "ESBA"
            };

            var sut = fixture.Create<ExcursionService>();

            // Act

            // Assert
            var result = await Assert.ThrowsAsync<ApiException>(() => sut.Search(request));
            Assert.Equal(result.Message, ApiExceptionCodes.ExcursionMapError.Description);
        }

        [Fact]
        public async Task Search_ExcursionMapTypeIsOutOfRange_ThrowArgumentOutOfRangeException()
        {
            // Arrange fixture
            var excursionMap = new ExcursionsMap
            {
                Type = DestinationItemType.VirtualRegion,   // it is out of range option
                MusementIds = new[] { "20", "30" }
            };

            var fixture = PrepareFixture(excursionMap, out var apiService, out var destinationService);

            // Arrange
            var request = new ExcursionsRequest
            {
                DestinationCode = "ESBA"
            };

            var sut = fixture.Create<ExcursionService>();

            // Act

            // Assert
            var result = await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => sut.Search(request));
            result.Message.Should().ContainEquivalentOf(nameof(excursionMap.Type));
        }

        [Fact]
        public async Task Search_ExcursionMapMusementIdsEmptyAndCoordinatesIsNull_ThrowApiException()
        {
            // Arrange fixture
            var excursionMap = new ExcursionsMap
            {
                Type = DestinationItemType.Region,
                MusementIds = new string[0],
                CentralLatitude = null,
                CentralLongitude = null
            };

            var fixture = PrepareFixture(excursionMap, out var apiService, out var destinationService);

            // Arrange
            var request = new ExcursionsRequest
            {
                DestinationCode = "ESBA"
            };

            var sut = fixture.Create<ExcursionService>();

            // Act

            // Assert
            var result = await Assert.ThrowsAsync<ApiException>(() => sut.Search(request));
            Assert.Equal(result.Message, ApiExceptionCodes.ExcursionMapCoordinatesError.Description);
        }

        [Fact]
        public async Task Search_ExcursionMapMusementIdsForCountry_ProvidesCorrectExcursionUrl()
        {
            // Arrange fixture
            var excursionMap = new ExcursionsMap
            {
                Type = DestinationItemType.Country,
                MusementIds = new string[] { "ES" },
                CentralLatitude = "48.864716",
                CentralLongitude = "2.349014"
            };

            var fixture = PrepareFixture(excursionMap, out _, out _);

            // Arrange
            var request = new ExcursionsRequest
            {
                DestinationCode = "ES"
            };

            var sut = fixture.Create<ExcursionService>();

            // Act
            var result = await sut.Search(request);

            // Assert
            result.ExcursionsLink.Should().Be($"https://whitelabel.com/uk/search?currency={Currency.GBP.Code}&country_in=ES&country_title=Spain");
        }

        [Theory]
        [InlineData(DestinationItemType.Region)]
        [InlineData(DestinationItemType.Resort)]
        public async Task Search_ExcursionMapMusementIdsMatchMusement_ProvidesCorrectExcursionUrl(DestinationItemType type)
        {
            // Arrange fixture
            var excursionMap = new ExcursionsMap
            {
                Type = type,
                MusementIds = new string[] { "111" },
                CentralLatitude = "48.864716",
                CentralLongitude = "2.349014"
            };

            var fixture = PrepareFixture(excursionMap, out _, out _);

            // Arrange
            var request = new ExcursionsRequest
            {
                DestinationCode = "ESBA"
            };

            var sut = fixture.Create<ExcursionService>();

            // Act
            var result = await sut.Search(request);

            // Assert
            result.ExcursionsLink.Should().Be($"https://whitelabel.com/uk/barcelona?currency={Currency.GBP.Code}");
        }

        [Theory]
        [InlineData(DestinationItemType.Region)]
        [InlineData(DestinationItemType.Resort)]
        public async Task Search_ExcursionMapMusementIdsMultipleMusement_ProvidesCorrectExcursionUrl(DestinationItemType type)
        {
            // Arrange fixture
            var excursionMap = new ExcursionsMap
            {
                Type = type,
                MusementIds = new string[] { "111", "222" },
                CentralLatitude = "48.864716",
                CentralLongitude = "2.349014"
            };

            var fixture = PrepareFixture(excursionMap, out _, out _);

            // Arrange
            var request = new ExcursionsRequest
            {
                DestinationCode = "ESBA"
            };

            var sut = fixture.Create<ExcursionService>();

            // Act
            var result = await sut.Search(request);

            // Assert
            result.ExcursionsLink.Should().Be($"https://whitelabel.com/uk/barcelona?currency={Currency.GBP.Code}");
        }

        [Theory]
        [AutoMoqData]
        public async Task Search_ExcursionMap_CorrectLanguage(string language)
        {
            // Arrange fixture
            var excursionMap = new ExcursionsMap
            {
                Type = DestinationItemType.Country,
                MusementIds = new string[] { "ES" },
                CentralLatitude = "48.864716",
                CentralLongitude = "2.349014"
            };

            var fixture = PrepareFixture(excursionMap, out _, out _);

            _languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns(language);
            _musementSettings.HeaderLanguageMap = new Dictionary<string, string>
            {
                {language, $"musement-{language}"}
            };
            _musementSettings.UrlLanguageMap = new Dictionary<string, string>
            {
                {language, $"url-{language}"}
            };

            // Arrange
            var request = new ExcursionsRequest
            {
                DestinationCode = "ES"
            };

            var sut = fixture.Create<ExcursionService>();

            // Act
            var result = await sut.Search(request);

            // Assert
            result.ExcursionsLink.Should().Be($"https://whitelabel.com/url-{language}/search?currency={Currency.GBP.Code}&country_in=ES&country_title=Spain");
        }

        [Theory]
        [InlineData(DestinationItemType.Region)]
        [InlineData(DestinationItemType.Resort)]
        public async Task Search_ExcursionMapMusementIdsEmptyMusement_ProvidesCorrectExcursionUrl(DestinationItemType type)
        {
            // Arrange fixture
            var excursionMap = new ExcursionsMap
            {
                Type = type,
                MusementIds = new string[0],
                CentralLatitude = "39.9777",
                CentralLongitude = "3.83955"
            };

            var fixture = PrepareFixture(excursionMap, out _, out _);

            // Arrange
            var request = new ExcursionsRequest
            {
                DestinationCode = "ESBA"
            };

            var sut = fixture.Create<ExcursionService>();

            // Act
            var result = await sut.Search(request);

            // Assert
            result.ExcursionsLink.Should().Be($"https://whitelabel.com/uk/search?currency={Currency.GBP.Code}&search_nearby=1&text=barcelona");
        }

        [Fact]
        public async Task Search_CalculateCentralCoordinates_CorrectResults()
        {
            // Arrange
            var excursionMap = new ExcursionsMap
            {
                Type = DestinationItemType.Region,
                Coordinates = new HotelSummary[]
                {
                    new()
                    {
                        Code = "H1",
                        Name = "H1",
                        Latitude = "39.9777",
                        Longitude = "3.83955"
                    },
                    new()
                    {
                        Code = "H2",
                        Name = "H2",
                        Latitude = "39.9271",
                        Longitude = "3.83536"
                    },
                    new()
                    {
                        Code = "H2",
                        Name = "H2",
                        Latitude = "40.0058",
                        Longitude = "3.8"
                    },
                    new()
                    {
                        Code = "H2",
                        Name = "H2",
                        Latitude = "39.8358",
                        Longitude = "4.2973"
                    },
                    new()
                    {
                        Code = "H2",
                        Name = "H2",
                        Latitude = "39.9966",
                        Longitude = "3.8268"
                    },
                    new()
                    {
                        Code = "H2",
                        Name = "H2",
                        Latitude = "39.92954",
                        Longitude = "3.822941"
                    },
                    new()
                    {
                        Code = "H2",
                        Name = "H2",
                        Latitude = "39.8886",
                        Longitude = "4.25643"
                    }


                },
                Radius = 100,
            };

            var musementSettingsMock = _fixture.Freeze<Mock<IOptions<MusementSettings>>>();
            musementSettingsMock.Setup(x => x.Value).Returns(_musementSettings);

            var cacheSettingsMock = _fixture.Freeze<Mock<IOptions<CacheSettings>>>();
            cacheSettingsMock.Setup(x => x.Value).Returns(new CacheSettings
            {
                Buckets = new Buckets
                {
                    SearchCache = "S",
                    FacilitiesCache = "F"
                },
                ExpirationSeconds = new Dictionary<string, int>
                {
                    {
                        "S", 3600
                    },
                    {
                        "F", 3600
                    }
                }
            });

            var cacheService = new CacheService(new TestDistributedCacheImplementation(),
                _fixture.Freeze<ILogger<CacheService>>(), cacheSettingsMock.Object, new JsonSerializationService());

            var apiService = _fixture.Freeze<Mock<IApiService>>();

            apiService.Setup(service =>
                    service.GetResponseContentAsync<ExcursionMapRequest, ExcursionMapResponse>(
                        It.IsAny<ExcursionMapRequest>()))
                .ReturnsAsync(new ExcursionMapResponse()
                {
                    Payload = new JsonApiPayload<ExcursionsMap>() { Body = excursionMap }
                });

            var cmsSettings = Options.Create<CmsSettings>(new CmsSettings()
            {
                Host = "https://sitecore.ci.holidays.easyjet.com",
                Api = new CmsApiSettings()
                {
                    GetExcursionMap = "api/DestinationsSearch/GetMuzementData",
                },
            });

            var endpointsProvider = new EndpointsProvider(cmsSettings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            var destinationsSearchService = new DestinationsSearchService(apiService.Object, endpointsProvider, null, null,
                Options.Create(new AtcomSettings()), cacheService, cacheSettingsMock.Object,
                cmsSettings, null);

            var excursionsMap = await destinationsSearchService.GetExcursionMap("Test");

            excursionsMap.CentralLatitude.Should().Be("39.93748597891519");
            excursionsMap.CentralLongitude.Should().Be("3.954200207880659");
        }

        private IFixture PrepareFixture(ExcursionsMap excursionMap, out Mock<IApiService> apiService, out Mock<IDestinationsService> destinationService)
        {
            var musementSettingsMock = _fixture.Freeze<Mock<IOptions<MusementSettings>>>();
            musementSettingsMock.Setup(x => x.Value).Returns(_musementSettings);

            var cacheSettingsMock = _fixture.Freeze<Mock<IOptions<CacheSettings>>>();
            cacheSettingsMock.Setup(x => x.Value).Returns(new CacheSettings
            {
                Buckets = new Buckets
                {
                    SearchCache = "S",
                    FacilitiesCache = "F"
                },
                ExpirationSeconds = new Dictionary<string, int>
                {
                    {
                        "S", 3600
                    },
                    {
                        "F", 3600
                    }
                }
            });

            _fixture.Register<ICacheService>(() => new CacheService(
                new TestDistributedCacheImplementation(),
                _fixture.Freeze<ILogger<CacheService>>(),
                cacheSettingsMock.Object,
                new JsonSerializationService()
            ));

            apiService = _fixture.Freeze<Mock<IApiService>>();

            // when getting musement activities
            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchActivitiesRequest, SearchActivitiesResponse>(
                        It.IsAny<SearchActivitiesRequest>()))
                .ReturnsAsync(new SearchActivitiesResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<ExcursionApiResponse>
                    {
                        Body = new ExcursionApiResponse
                        {
                            Data = new List<SearchActivitiesResponseBody>
                            {
                                new SearchActivitiesResponseBody
                                {
                                    Title = "Private transfer between Naples International Airport and city center",
                                    Description = "Book your private transfer between Naples International ...",
                                    LikelyToSellOut = true,
                                    CoverImageUrl = "https://images.musement.com/cover/0115/20/thumb_11419579_cover_header.jpeg?w=540",
                                    RetailPrice = new PriceResponseBody
                                    {
                                        Currency = "GBP",
                                        Value = 38.0m
                                    },
                                    ReviewsNumber = 5,
                                    ReviewsAggregatedInfo = new ReviewsInfoResponseBody
                                    {
                                        One = 1,
                                        Two = 2,
                                        Three = 3,
                                        Four = 4,
                                        Five = 5
                                    },
                                    ReviewsAvg = 3,
                                    City = new CityResponseBody
                                    {
                                        Id = 1,
                                        Country = new CountryResponseBody
                                        {
                                            Id = 1,
                                            Name = "Spain",
                                        },
                                        Name = "costa-dorada"
                                    },
                                    FreeCancellation = true,
                                    Url = "https://www.musement.com/us/naples/private-transfer-between-naples-international-airport-and-city-center-235095/"
                                }
                            }
                        }
                    }
                });

            // when getting data for musement whitelabel url
            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchCitiesRequest, SearchCitiesResponse>(
                        It.IsAny<SearchCitiesRequest>()))
                .ReturnsAsync(new SearchCitiesResponse()
                {
                    Payload = new JsonApiPayload<SearchCitiesResponseBody[]>
                    {
                        Body = new SearchCitiesResponseBody[]
                        {
                            new SearchCitiesResponseBody{Id = 1, Name = "Barcelona"},
                            new SearchCitiesResponseBody{Id = 2, Name = "Cadiz"}
                        }
                    }
                });

            destinationService = _fixture.Freeze<Mock<IDestinationsService>>();
            destinationService.Setup(service => service.GetExcursionMap(It.IsAny<string>())).ReturnsAsync(excursionMap);

            var marketServiceMock = _fixture.Freeze<Mock<IMarketService>>();
            marketServiceMock.Setup(service => service.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Currency = Currency.GBP
                });

            _languageServiceMock.Setup(service => service.GetCurrentLanguage())
                .Returns("en");

            return _fixture;
        }

    }

    public class TestDistributedCacheImplementation : IDistributedCache
    {
        private Dictionary<string, byte[]> _storage = new Dictionary<string, byte[]>();

        public byte[] Get(string key)
        {
            return _storage.ContainsKey(key) ? _storage[key] : null;
        }

        public Task<byte[]> GetAsync(string key, CancellationToken token = default)
        {
            var task = new Task<byte[]>(() => { return _storage.ContainsKey(key) ? _storage[key] : null; });
            task.Start();

            return task;
        }

        public void Refresh(string key)
        {
            throw new NotImplementedException();
        }

        public Task RefreshAsync(string key, CancellationToken token = default)
        {
            throw new NotImplementedException();
        }

        public void Remove(string key)
        {
            throw new NotImplementedException();
        }

        public Task RemoveAsync(string key, CancellationToken token = default)
        {
            throw new NotImplementedException();
        }

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
        {
            _storage[key] = value;
        }

        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
        {
            var task = new Task(() => { _storage[key] = value; });
            task.Start();

            return task;
        }
    }
}
