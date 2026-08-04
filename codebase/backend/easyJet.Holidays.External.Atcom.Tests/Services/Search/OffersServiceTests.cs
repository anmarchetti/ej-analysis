using Amazon.DynamoDBv2.Model;
using AutoFixture;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.LivePrice;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Interfaces.SitecorePersonalize;
using easyJet.Holidays.Api.Domain.Interfaces.SmartSeer;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Serialization;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.SmartSeer.Models;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.ObjectModel;
using System.Reflection;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.Search
{
    public class OffersServiceTests
    {
        private AtcomSettings _atcomSettings = CreateAtcomSettings();        

        private SmartSeerSettings _smartSeerSettings = new SmartSeerSettings
        {
            ThresholdSettings = new ThresholdSettings
            {
                ExtendedThreshold = new ThresholdValues() { ThresholdName = "SmartSeer-Res-Extended", ThresholdDays = 150 },
                LongThreshold = new ThresholdValues() { ThresholdName = "SmartSeer-Long", ThresholdDays = 90 },
                MediumThreshold = new ThresholdValues() { ThresholdName = "SmartSeer-Medium", ThresholdDays = 30 },
                ShortThreshold = new ThresholdValues() { ThresholdName = "SmartSeer-Short", ThresholdDays = 0 }
            }
        };

        private readonly IFixture fixture;
        private readonly Mock<IMarketService> marketService;
        private readonly Mock<ISmartSeerService> smartSeerService;
        private readonly Mock<IReferenceDataService> referenceDataService;
        private readonly Mock<IHotelsService> hotelsService;
        private readonly Mock<IApiService> apiService;
        private readonly Mock<IDestinationsService> destinationsService;
        private readonly Mock<ISettingsService> settingsService;
        private readonly Mock<ILivePriceService> livePriceService;
        private readonly Mock<SearchOffersService> searchOffersService;
        private readonly Mock<ITouristTaxCalculator> touristTaxCalculator;
        private readonly Mock<ISitecorePersonalizeService> sitecorePersonalizeService;
        private readonly OffersService sut;

        public OffersServiceTests()
        {
            fixture = PrepareFixture(out var apiServiceMock, out var destinationServiceMock);
            apiService = apiServiceMock;
            destinationsService = destinationServiceMock;

            var smartSeerSettingMock = fixture.Freeze<Mock<IOptions<SmartSeerSettings>>>();
            smartSeerSettingMock.Setup(x => x.Value).Returns(_smartSeerSettings);

            marketService = fixture.Freeze<Mock<IMarketService>>();
            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings
            {
                AirportDepartureCodes = new HashSet<string> { "LGW", "LTW" }
            });

            settingsService = fixture.Freeze<Mock<ISettingsService>>();
            smartSeerService = fixture.Freeze<Mock<ISmartSeerService>>();
            referenceDataService = fixture.Freeze<Mock<IReferenceDataService>>();
            hotelsService = fixture.Freeze<Mock<IHotelsService>>();
            livePriceService = fixture.Freeze<Mock<ILivePriceService>>();
            searchOffersService = fixture.Freeze<Mock<SearchOffersService>>();
            touristTaxCalculator = fixture.Freeze<Mock<ITouristTaxCalculator>>();
            touristTaxCalculator
                .Setup(x => x.EnrichOffersWithTouristTax(It.IsAny<ReadOnlyCollection<Offer>>(), It.IsAny<OfferHotel>()))
                .Returns(Task.CompletedTask);
            touristTaxCalculator
                .Setup(x => x.EnrichOffersWithTouristTax(It.IsAny<ReadOnlyCollection<AvCacheResultOffersOfferExtended>>()))
                .Returns(Task.CompletedTask);

            var atcomSettings = Options.Create<AtcomSettings>(new AtcomSettings
            {
                AnywhereCode = "ALL",
                ComplimentaryLuggage = new ComplimentaryLuggageSettings
                {
                    DefaultMarketPart = "EU",
                    DefaultPromoPart = "BO",
                    MarketPromoCodeMapping = new Dictionary<string, string>
                    {
                        { "UK", "EU"},
                        { "DE", "DE"},
                        { "CH", "CH"},
                        { "FR", "FR"}
                    },
                    ThemePromoCodeMapping = new Dictionary<string, string>
                    {
                        { "B", "BO" },
                        { "C", "CO" },
                        { "L", "LO" }
                    }
                }
            });
            
            sitecorePersonalizeService = fixture.Freeze<Mock<ISitecorePersonalizeService>>();

            sut = new OffersService(
                searchOffersService.Object,
                hotelsService.Object,
                referenceDataService.Object,
                Options.Create<SearchSettings>(new SearchSettings()),
                fixture.Create<ILogger<OffersService>>(),
                fixture.Create<SearchAvailablePackagesFilterAndMapper>(),
                smartSeerService.Object,
                destinationsService.Object,
                fixture.Create<IPromotionValidatorService>(),
                livePriceService.Object,
                fixture.Create<IPricesService>(),
                marketService.Object,
                atcomSettings,
                sitecorePersonalizeService.Object);
        }

        [Fact]
        public async Task Second_Request_Is_Cached()
        {
            // Arrange
            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = "ES,ESCB",
                Destinations = new[] { "country:ES", "region:ESCB" },
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                }
            };

            // Act One
            var result = await sut.Search(request);

            // Act Two
            var resultCache = await sut.Search(request);

            // Assert
            apiService
                .Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()),
                Times.Once
            );
        }

        [Theory]
        [InlineData("LGW,CDG")]
        [InlineData("ALL")]
        public async Task Search_DepartureAirportsFiltered(string departure)
        {
            // Arrange
            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = departure,
                Geography = "ES,ESCB",
                Destinations = new[] { "country:ES", "region:ESCB" },
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                }
            };

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings
            {
                AirportDepartureCodes = new HashSet<string> { "LGW" },
            });

            // Act
            var result = await sut.Search(request);

            // Assert
            apiService
                .Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.Is<SearchAvailablePackagesRequest>(x => x.Departure.Length == 1 && x.Departure[0] == "LGW")),
                Times.Once
            );
        }

        [Fact]
        public async Task ChangedParameter_Reset_Cache()
        {
            // Arrange
            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                MarketCode = Market.Uk
            };

            // Act One
            var result = await sut.Search(request);

            request.Departure = "LTN";

            // Act Two
            var resultNoCache = await sut.Search(request);

            // Assert
            apiService
                .Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()),
                Times.Exactly(2)
            );
        }

        [Theory]
        [AutoMoqData]
        public async Task DoSearch_PriceLimitPerPerson_AddedMaxAndMixPricePPParameters(double minPrice, double maxPrice)
        {
            // Arrange
            referenceDataService.Setup(service => service.GetPriceLimit()).ReturnsAsync(new PriceLimitSettings()
            {
                IsPricePerPerson = true,
                MaxPrice = maxPrice,
                MinPrice = minPrice,
            });

            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
            };

            // Act
            var result = await sut.Search(request);

            // Assert
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.Is<SearchAvailablePackagesRequest>(packagesRequest =>
                        packagesRequest.MaxPrice.Equals(maxPrice) && packagesRequest.MinPrice.Equals(minPrice) && packagesRequest.PriceType.Equals("PP"))), Times.Exactly(1));
        }

        [Theory]
        [AutoMoqData]
        public async Task DoSearch_PriceLimitPerPerson_NotFlexible(double minPrice, double maxPrice)
        {
            // Arrange
            referenceDataService.Setup(service => service.GetPriceLimit()).ReturnsAsync(new PriceLimitSettings()
            {
                IsPricePerPerson = true,
                MaxPrice = maxPrice,
                MinPrice = minPrice,
            });

            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 0,
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
            };

            // Act
            var result = await sut.Search(request);

            // Assert
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.Is<SearchAvailablePackagesRequest>(packagesRequest =>
                        packagesRequest.MaxPrice.Equals(maxPrice) && packagesRequest.MinPrice.Equals(minPrice) && packagesRequest.PriceType.Equals("PP"))), Times.Exactly(1));
        }

        [Theory]
        [AutoMoqData]
        public async Task DoSearch_PriceLimitTotalPrice_AddedMaxAndMixPriceTPParameters(double minPrice, double maxPrice)
        {
            // Arrange
            referenceDataService.Setup(service => service.GetPriceLimit()).ReturnsAsync(new PriceLimitSettings()
            {
                IsPricePerPerson = false,
                MaxPrice = maxPrice,
                MinPrice = minPrice,
            });

            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
            };

            // Act
            var result = await sut.Search(request);

            // Assert
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.Is<SearchAvailablePackagesRequest>(packagesRequest =>
                        packagesRequest.MaxPrice.Equals(maxPrice) && packagesRequest.MinPrice.Equals(minPrice) && packagesRequest.PriceType.Equals("TP"))), Times.Exactly(1));
        }

        [Theory]
        [InlineData("S")]
        [InlineData("F")]
        public async Task DoSearch_ShouldContainBrandCodeParameter(string brandCode)
        {
            // Arrange
            marketService
                .Setup(service => service.GetMarket(Market.Uk))
                .Returns(new MarketSettings
                {
                    AtcomBrandCode = brandCode,
                    AirportDepartureCodes = new HashSet<string> { "LGW" }
                });

            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                IsPromo = false,
                MarketCode = Market.Uk
            };

            // Act
            var result = await sut.Search(request);

            // Assert
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.Is<SearchAvailablePackagesRequest>(packagesRequest =>
                        packagesRequest.QueryParams.Contains($"brnd={brandCode}"))), Times.Exactly(1));
        }

        [Theory]
        [AutoMoqData]
        public async Task DoSearch_IfPromoRequest_ShouldAddPromoCacheBustingQueryParameter(PromoCacheBustingSetting cacheBustingSetting)
        {
            // Arrange 
            settingsService.Setup(service => service.GetPromoCacheBustingSetting()).ReturnsAsync(cacheBustingSetting);

            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                IsPromo = true
            };

            // Act
            var result = await sut.Search(request);

            // Assert
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.Is<SearchAvailablePackagesRequest>(packagesRequest =>
                        packagesRequest.PromoCacheBusting.Equals(cacheBustingSetting.QueryValue))), Times.Exactly(1));
        }

        [Theory]
        [AutoMoqData]
        public async Task DoSearch_IfNotPromoRequest_RequestWithoutCacheBustingQueryParameter(PromoCacheBustingSetting cacheBustingSetting)
        {
            // Arrange 
            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                IsPromo = false
            };

            // Act
            var result = await sut.Search(request);

            // Assert
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                    It.Is<SearchAvailablePackagesRequest>(packagesRequest =>
                        String.IsNullOrEmpty(packagesRequest.PromoCacheBusting))), Times.Exactly(1)
            );
        }

        [Fact]
        public async Task Search_DepartureSet_FilterOutNonMarketAirports()
        {
            // Arrange 
            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW,LTN",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                IsPromo = false,
                MarketCode = Market.Uk
            };

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings
            {
                AirportDepartureCodes = new HashSet<string> { "LTN" }
            });

            // Act
            var result = await sut.Search(request);

            // Assert
            searchOffersService.Verify(
                x => x.DoSearch(It.Is<PackagesSearchRequest>(x => x.Departure == "LTN"))
            );
        }


        [Theory]
        [AutoMoqData]
        public async Task SearchRecommendedOffers_IfNotPromoRequest_RequestNotChanged(PromoCacheBustingSetting cacheBustingSetting)
        {
            // Arrange
            var request = new RecommendedSearchRequest()
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                IsPromo = false
            };

            // Act
            var result = await sut.SearchRecommendedOffers(request);

            // Assert
            request.Geography.Should().BeEquivalentTo("ES");
        }

        [Theory]
        [InlineData("ES", "")]
        [InlineData("", "X88776")]
        public async Task SearchRecommendedOffers_IfPromoRequest_RequestChanged(string geography, string accommCode)
        {
            // Arrange

            List<DestinationItem> destinationItems = new() { new DestinationItem() };

            var request = new RecommendedSearchRequest()
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = geography,
                AccomCodes = accommCode,
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                IsPromo = true,
                PromoPageId = Guid.NewGuid().ToString()
            };

            destinationsService.Setup(ds => ds.GetPromoDestinations(request.PromoPageId))
                .ReturnsAsync(destinationItems);

            // Act
            var result = await sut.SearchRecommendedOffers(request);

            // Assert
            request.Geography.Should().BeEquivalentTo(geography);
        }

        [Theory]
        [AutoMoqData]
        public async Task SearchRecommendedOffers_IfPromoRequest_RequestUpdated(PromoCacheBustingSetting cacheBustingSetting, Guid promoPageId)
        {
            // Arrange
            var request = new RecommendedSearchRequest()
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                IsPromo = true,
                PromoPageId = promoPageId.ToString(),
            };

            // Act
            var result = await sut.SearchRecommendedOffers(request);

            // Assert
            destinationsService.Verify(service => service.GetPromoDestinations(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task SearchRecommendedOffers_WhenRoomProvided_DoesNotOverrideRoomAllocation()
        {
            // Arrange
            var request = GetRecommendedRequest();
            request.Room = new List<RoomAllocation> { new() { Adults = 2 } };

            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody
                {
                    Response = new SmartSeerResponseBody
                    {
                        Elements = new List<SortResponseElements>
                        {
                            new SortResponseElements { Id = "Accom1" }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 1,
                    NumberOfRequestedHotelsAtcom = 1,
                    NumberOfRequestedHotelsSmartSeer = 1
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new[]
                {
                    new Hotel { Code = "Accom1", GiataCode = "0001" }
                });

            searchOffersService
                .Setup(x => x.DoSearch(It.IsAny<PackagesSearchRequest>()))
                .ReturnsAsync((CreateResponse(CreateOffers("Accom1")), false));

            marketService
                .Setup(x => x.GetMarket(It.IsAny<string>()))
                .Returns(new MarketSettings
                {
                    AirportDepartureCodes = new HashSet<string> { "LGW", "TestArr" }
                });

            // Act
            await sut.SearchRecommendedOffers(request);

            // Assert
            searchOffersService.Verify(
                x => x.DoSearch(It.Is<PackagesSearchRequest>(
                    r => r.Room != null && r.Room.Count == 1 && r.Room[0].Adults == 2)),
                Times.AtLeastOnce);

            searchOffersService.Verify(
                x => x.DoSearch(It.Is<PackagesSearchRequest>(
                    r => r.Room != null && r.Room.Count == 1 && r.Room[0].Adults == 1)),
                Times.Never);
        }

        [Fact]
        public async Task SearchRecommendedOffers_WhenRoomIsNull_SetsDefaultRoomAllocation()
        {
            // Arrange
            var request = GetRecommendedRequest();
            request.Room = null;

            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody
                {
                    Response = new SmartSeerResponseBody
                    {
                        Elements = new List<SortResponseElements>
                        {
                            new SortResponseElements { Id = "Accom1" }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 1,
                    NumberOfRequestedHotelsAtcom = 1,
                    NumberOfRequestedHotelsSmartSeer = 1
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new[]
                {
                    new Hotel { Code = "Accom1", GiataCode = "0001" }
                });

            searchOffersService
                .Setup(x => x.DoSearch(It.IsAny<PackagesSearchRequest>()))
                .ReturnsAsync((CreateResponse(CreateOffers("Accom1")), false));

            marketService
                .Setup(x => x.GetMarket(It.IsAny<string>()))
                .Returns(new MarketSettings
                {
                    AirportDepartureCodes = new HashSet<string> { "LGW", "TestArr" }
                });

            // Act
            await sut.SearchRecommendedOffers(request);

            // Assert
            searchOffersService.Verify(
                x => x.DoSearch(It.Is<PackagesSearchRequest>(
                    r => r.Room != null && r.Room.Count == 1 && r.Room[0].Adults == 1)),
                Times.AtLeastOnce);
        }

        [Fact]
        public async Task SearchRecommendedOffers_WhenRoomIsEmpty_KeepsEmptyRoomAllocation()
        {
            // Arrange
            var request = GetRecommendedRequest();
            request.Room = new List<RoomAllocation>();

            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody
                {
                    Response = new SmartSeerResponseBody
                    {
                        Elements = new List<SortResponseElements>
                        {
                            new SortResponseElements { Id = "Accom1" }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 1,
                    NumberOfRequestedHotelsAtcom = 1,
                    NumberOfRequestedHotelsSmartSeer = 1
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new[]
                {
                    new Hotel { Code = "Accom1", GiataCode = "0001" }
                });

            searchOffersService
                .Setup(x => x.DoSearch(It.IsAny<PackagesSearchRequest>()))
                .ReturnsAsync((CreateResponse(CreateOffers("Accom1")), false));

            marketService
                .Setup(x => x.GetMarket(It.IsAny<string>()))
                .Returns(new MarketSettings
                {
                    AirportDepartureCodes = new HashSet<string> { "LGW", "TestArr" }
                });

            // Act
            await sut.SearchRecommendedOffers(request);

            // Assert
            searchOffersService.Verify(
                x => x.DoSearch(It.Is<PackagesSearchRequest>(
                    r => r.Room != null && r.Room.Count == 0)),
                Times.AtLeastOnce);
        }

        [Fact]
        public async Task SearchRecommendedOffers_WhenLivePrice_DoesNotEnrichOffersWithTouristTax()
        {
            // Arrange
            var request = GetRecommendedRequest();
            request.IsLivePrice = true;
            request.Destinations = null;

            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody
                {
                    Response = new SmartSeerResponseBody
                    {
                        Elements = new List<SortResponseElements>
                        {
                            new SortResponseElements { Id = "Accom1" }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 1,
                    NumberOfRequestedHotelsAtcom = 1,
                    NumberOfRequestedHotelsSmartSeer = 1
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new[]
                {
                    new Hotel { Code = "Accom1", GiataCode = "0001" }
                });

            livePriceService
                .Setup(x => x.GetPrice(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new[]
                {
                    new LivePriceSummaryModel
                    {
                        PackageId = "0000000001/1/0001/1",
                        Geog = "0001",
                        AccomCode = "Accom1",
                        Price = 100,
                        PricePP = 100,
                        OutboundAirport = "LGW",
                        SearchCriteria = new SearchCriteria
                        {
                            Duration = 7,
                            Date = DateTimeOffset.UtcNow,
                            Adults = 2
                        }
                    }
                });

            marketService
                .Setup(x => x.GetMarket(It.IsAny<string>()))
                .Returns(new MarketSettings
                {
                    AirportDepartureCodes = new HashSet<string> { "LGW" }
                });

            // Act
            await sut.SearchRecommendedOffers(request);

            // Assert
            touristTaxCalculator.Verify(
                x => x.EnrichOffersWithTouristTax(It.IsAny<ReadOnlyCollection<Offer>>(), It.IsAny<OfferHotel>()),
                Times.Never);
        }
        [Fact]
        public async Task SearchRecommendedOffers_Success_NoGiata()
        {
            // Arrange
            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody()
                {
                    Response = new SmartSeerResponseBody()
                    {
                        Elements = new List<SortResponseElements>()
                        {
                            new SortResponseElements()
                            {
                                Id = "Test1"
                            }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 1,
                    NumberOfRequestedHotelsAtcom = 1,
                    NumberOfRequestedHotelsSmartSeer = 1
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new Hotel[1] { new Hotel(){
                    GiataCode = null,
                    Code = "Test1"
                }});
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<string>());

            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                        It.Is<SearchAvailablePackagesRequest>(y => y.AccomCodes.Contains("Test1"))))
                .ReturnsAsync(CreateResponse(new List<AvCacheResultOffersOffer>
                {
                    new AvCacheResultOffersOffer
                    {
                        Accom = new[]
                        {
                            new AvCacheResultOffersOfferAccom { Code = "Test1", Unit = new [] { new AvCacheResultOffersOfferAccomUnit() } }
                        },
                        Transport = new AvCacheResultOffersOfferTransport
                        {
                            Route = new [] { new AvCacheResultOffersOfferTransportRoute { DepPt = "LGW", ArrPt = "TestArr", DepDate = DateTime.UtcNow, ArrDate = DateTime.UtcNow.AddDays(1), DepTime = "1405", ArrTime = "2105" } }
                        }
                    }
                }));

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
            {
                AirportDepartureCodes = new HashSet<string>()
                {
                    "LGW",
                }
            });

            // Act
            var result = await sut.SearchRecommendedOffers(GetRecommendedRequest());

            result.Offers.Count.Should().Be(1);
        }
        
        [Fact]
        public async Task SearchRecommendedOffersWithSettings_Success_SponsoredLabel()
        {
            // Arrange
            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody()
                {
                    Response = new SmartSeerRecommendationsResponseBody()
                    {
                        Elements = new List<SortResponseElements>()
                        {
                            new SortResponseElements()
                            {
                                Id = "Test1",
                                IsSponsored = true,
                                ElementTracking = "test",
                            }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 1,
                    NumberOfRequestedHotelsAtcom = 1,
                    NumberOfRequestedHotelsSmartSeer = 1
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new Hotel[1] { new Hotel(){
                    GiataCode = null,
                    Code = "Test1"
                }});
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<string>());

            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                        It.Is<SearchAvailablePackagesRequest>(y => y.AccomCodes.Contains("Test1"))))
                .ReturnsAsync(CreateResponse(new List<AvCacheResultOffersOffer>
                {
                    new AvCacheResultOffersOffer
                    {
                        Accom = new[]
                        {
                            new AvCacheResultOffersOfferAccom { Code = "Test1", Unit = new [] { new AvCacheResultOffersOfferAccomUnit() } }
                        },
                        Transport = new AvCacheResultOffersOfferTransport
                        {
                            Route = new [] { new AvCacheResultOffersOfferTransportRoute { DepPt = "LGW", ArrPt = "TestArr", DepDate = DateTime.UtcNow, ArrDate = DateTime.UtcNow.AddDays(1), DepTime = "1405", ArrTime = "2105" } }
                        }
                    }
                }));

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
            {
                AirportDepartureCodes = new HashSet<string>()
                {
                    "LGW",
                }
            });

            // Act
            var result = await sut.SearchRecommendedOffers(GetRecommendedRequest(true));

            result.Offers.Count.Should().Be(1);
            result.Offers[0].IsSponsored.Should().BeTrue();
            result.Offers[0].Tracking.Should().NotBeNull();
            result.Offers[0].Tracking.Should().Be("test");
        }
        
        [Fact]
        public async Task SearchRecommendedOffersNoSettings_Success_SponsoredLabel()
        {
            // Arrange
            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody()
                {
                    Response = new SmartSeerRecommendationsResponseBody()
                    {
                        Elements = new List<SortResponseElements>()
                        {
                            new SortResponseElements()
                            {
                                Id = "Test1",
                                IsSponsored = true,
                                ElementTracking = "test",
                            }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 1,
                    NumberOfRequestedHotelsAtcom = 1,
                    NumberOfRequestedHotelsSmartSeer = 1
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new Hotel[1] { new Hotel(){
                    GiataCode = null,
                    Code = "Test1"
                }});
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<string>());

            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                        It.Is<SearchAvailablePackagesRequest>(y => y.AccomCodes.Contains("Test1"))))
                .ReturnsAsync(CreateResponse(new List<AvCacheResultOffersOffer>
                {
                    new AvCacheResultOffersOffer
                    {
                        Accom = new[]
                        {
                            new AvCacheResultOffersOfferAccom { Code = "Test1", Unit = new [] { new AvCacheResultOffersOfferAccomUnit() } }
                        },
                        Transport = new AvCacheResultOffersOfferTransport
                        {
                            Route = new [] { new AvCacheResultOffersOfferTransportRoute { DepPt = "LGW", ArrPt = "TestArr", DepDate = DateTime.UtcNow, ArrDate = DateTime.UtcNow.AddDays(1), DepTime = "1405", ArrTime = "2105" } }
                        }
                    }
                }));

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
            {
                AirportDepartureCodes = new HashSet<string>()
                {
                    "LGW",
                }
            });

            // Act
            var result = await sut.SearchRecommendedOffers(GetRecommendedRequest());

            result.Offers.Count.Should().Be(1);
            result.Offers[0].IsSponsored.Should().BeTrue();
            result.Offers[0].Tracking.Should().NotBeNull();
            result.Offers[0].Tracking.Should().Be("test");
        }

        [Fact]
        public async Task SearchRecommendedOffers_Success_NoGiata_Multiple_Requests_To_Atcom()
        {
            // Arrange
            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody()
                {
                    Response = new SmartSeerResponseBody()
                    {
                        Elements = new List<SortResponseElements>()
                        {
                            new SortResponseElements()
                            {
                                Id = "Test1"
                            },
                            new SortResponseElements()
                            {
                                Id = "Test2"
                            }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 2,
                    NumberOfRequestedHotelsAtcom = 1,
                    NumberOfRequestedHotelsSmartSeer = 2
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new Hotel[2] { new Hotel(){
                    GiataCode = null,
                    Code = "Test1"
                }, new Hotel(){
                    GiataCode = null,
                    Code = "Test2"
                }});
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<string>());

            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                        It.Is<SearchAvailablePackagesRequest>(y => y.AccomCodes.Contains("Test1"))))
                .ReturnsAsync(CreateResponse(CreateOffers("Test1")));
            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                        It.Is<SearchAvailablePackagesRequest>(y => y.AccomCodes.Contains("Test2"))))
                .ReturnsAsync(CreateResponse(CreateOffers("Test2")));

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
            {
                AirportDepartureCodes = new HashSet<string>()
                {
                    "TestArr",
                }
            });

            // Act
            var result = await sut.SearchRecommendedOffers(GetRecommendedRequest());

            result.Offers.Count.Should().Be(2);
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()), Times.Exactly(2));
        }

        [Fact]
        public async Task SearchRecommendedOffers_Success_Has_GIATA_Single_Request()
        {
            // Arrange
            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody()
                {
                    Response = new SmartSeerResponseBody()
                    {
                        Elements = new List<SortResponseElements>()
                        {
                            new SortResponseElements()
                            {
                                Id = "Test1"
                            },
                            new SortResponseElements()
                            {
                                Id = "Test2"
                            }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 1,
                    NumberOfRequestedHotelsAtcom = 1,
                    NumberOfRequestedHotelsSmartSeer = 1
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new Hotel[2] { new Hotel(){
                    GiataCode = "1",
                    Code = "Test1"
                }, new Hotel(){
                    GiataCode = "1",
                    Code = "Test2"
                }});
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<string>());

            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                        It.Is<SearchAvailablePackagesRequest>(y => y.AccomCodes.Contains("Test1"))))
                .ReturnsAsync(CreateResponse(CreateOffers("Test1")));

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
            {
                AirportDepartureCodes = new HashSet<string>()
                {
                    "LGW",
                }
            });

            // Act
            var result = await sut.SearchRecommendedOffers(GetRecommendedRequest());

            result.Offers.Count.Should().Be(1);
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()), Times.Exactly(1));
        }

        [Fact]
        public async Task SearchRecommendedOffers_No_SmartSeerResponse()
        {
            // Arrange
            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody()
                {
                    Response = new SmartSeerResponseBody()
                    {
                        Elements = new List<SortResponseElements>() { }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 1,
                    NumberOfRequestedHotelsAtcom = 1,
                    NumberOfRequestedHotelsSmartSeer = 1
                });

            // Act
            var result = await sut.SearchRecommendedOffers(GetRecommendedRequest());

            result.Offers.Count.Should().Be(0);
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()), Times.Exactly(0));
        }

        [Fact]
        public async Task SearchRecommendedOffers_No_Availability()
        {
            // Arrange
            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody()
                {
                    Response = new SmartSeerRecommendationsResponseBody()
                    {
                        Elements = new List<SortResponseElements>()
                        {
                            new SortResponseElements()
                            {
                                Id = "Test1"
                            },
                            new SortResponseElements()
                            {
                                Id = "Test2"
                            }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 2,
                    NumberOfRequestedHotelsAtcom = 2,
                    NumberOfRequestedHotelsSmartSeer = 2
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new Hotel[2] { new Hotel(){
                    Code = "Test1"
                }, new Hotel(){
                    Code = "Test2",
                }});
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<string>());

            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                        It.Is<SearchAvailablePackagesRequest>(y => y.AccomCodes.Contains("Test1"))))
                .ReturnsAsync(CreateResponse(CreateOffers("Test1")));

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
            {
                AirportDepartureCodes = new HashSet<string>()
                {
                    "TestArr",
                }
            });

            // Act
            var result = await sut.SearchRecommendedOffers(GetRecommendedRequest());

            result.Offers.Count.Should().Be(0);
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()), Times.Exactly(1));
        }

        [Fact]
        public async Task SearchRecommendedOffers_No_AvailabilityForMarket()
        {
            // Arrange
            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody()
                {
                    Response = new SmartSeerRecommendationsResponseBody()
                    {
                        Elements = new List<SortResponseElements>()
                        {
                            new SortResponseElements()
                            {
                                Id = "Test1"
                            },
                            new SortResponseElements()
                            {
                                Id = "Test2"
                            }
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 2,
                    NumberOfRequestedHotelsAtcom = 2,
                    NumberOfRequestedHotelsSmartSeer = 2
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new Hotel[2] { new Hotel(){
                    Code = "Test1"
                }, new Hotel(){
                    Code = "Test2",
                }});
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<string>());

            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                        It.Is<SearchAvailablePackagesRequest>(y => y.AccomCodes.Contains("Test1"))))
                .ReturnsAsync(CreateResponse(CreateOffers("Test1")));

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
            {
                AirportDepartureCodes = new HashSet<string>(),
            });

            // Act
            var result = await sut.SearchRecommendedOffers(GetRecommendedRequest());

            result.Offers.Count.Should().Be(0);
            apiService.Verify(
                x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()), Times.Exactly(1));
        }

        [Fact]
        public async Task SearchRecommendedOffers_ReturnsLivePriceByGiataCode()
        {
            //Arrange
            var request = GetRecommendedRequest();
            request.IsLivePrice = true;
            request.Destinations = null;

            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody()
                {
                    Response = new SmartSeerResponseBody()
                    {
                        Elements = new List<SortResponseElements>()
                        {
                            new SortResponseElements() { Id = "Accom1" },
                            new SortResponseElements() { Id = "Accom2" },
                        }
                    }
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 2,
                    NumberOfRequestedHotelsAtcom = 2,
                    NumberOfRequestedHotelsSmartSeer = 2
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new List<Hotel>
                    {
                        new Hotel { Code = "Accom2", GiataCode = "0002" },
                        new Hotel { Code = "Accom1", GiataCode = "0001" },
                    });

            var searchCriteria = new SearchCriteria { Duration = 7, Date = DateTimeOffset.Now.AddDays(3) };

            livePriceService
                .Setup(x => x.GetPrice(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(
                    new[]
                    {
                        new LivePriceSummaryModel { PackageId = "0000000001/1/0001/1", Geog = "0001", AccomCode = "Accom1", Price = 100, PricePP = 100, SearchCriteria = searchCriteria },
                        new LivePriceSummaryModel { PackageId = "0000000001/1/0001/1", Geog = "0002", AccomCode = "Accom2", Price = 200, PricePP = 200, SearchCriteria = searchCriteria },
                    });

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
            {
                AirportDepartureCodes = new HashSet<string>()
                {
                    "TestArr",
                }
            });

            //Act
            var result = await sut.SearchRecommendedOffers(request);

            //Assert
            result.Should().NotBeNull();
            result.Offers.Should().HaveCount(2);
            result.Offers.First(x => x.Accom.Code == "Accom1").Price.Should().Be(100);
            result.Offers.First(x => x.Accom.Code == "Accom2").Price.Should().Be(200);
        }

        [Theory]
        [InlineData("UK", null, "EUBO")]
        [InlineData(null, "B", "EUBO")]
        [InlineData("UK", "B", "EUBO")]
        [InlineData("UK", "C", "EUCO")]
        [InlineData("UK", "L", "EULO")]
        [InlineData("DE", "B", "DEBO")]
        [InlineData("CH", "B", "CHBO")]
        [InlineData("FR", "B", "FRBO")]
        public async Task SearchRecommendedOffers_ReturnsLivePriceByGiataCodeWithPromCode(string market, string theme, string expected)
        {
            //Arrange
            var request = GetRecommendedRequest();
            request.IsLivePrice = true;
            request.RequestedAmountOfHotels = 10.ToString();

            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(
                    new SmartSeerSortedBody
                    {
                        Response = new SmartSeerResponseBody
                        {
                            Elements = new List<SortResponseElements> { new SortResponseElements() { Id = "Accom1" } }
                        }
                    });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 2,
                    NumberOfRequestedHotelsAtcom = 2,
                    NumberOfRequestedHotelsSmartSeer = 2
                });

            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new List<Hotel> { new() { Code = "Accom1", GiataCode = "0001" } });

            livePriceService
                .Setup(x => x.GetPrice(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(
                    new[]
                    {
                        new LivePriceSummaryModel
                        {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "0001",
                            AccomCode = "Accom1",
                            Price = 100,
                            PricePP = 100,
                            Market = market,
                            SearchCriteria = new SearchCriteria
                            {
                                Duration = 7,
                                Date = DateTimeOffset.Now.AddDays(3),
                                ThemeTypesCodes = new [] { theme }
                            }
                        }
                    });

            //Act
            var result = await sut.SearchRecommendedOffers(request);

            //Assert
            result.Should().NotBeNull();
            result.Offers.First().Accom.Prom.Should().Be(expected);
        }

        [Fact]
        public async Task SearchRecommendedOffers_ReturnsAvailableAccomsInBd4Order()
        {
            string[] ids = ["Accom1", "Accom2", "Accom3", "Accom4", "Accom5"];
            //Arrange
            smartSeerService
                .Setup(x => x.GetHotelsRecomendations(It.IsAny<RecommendedSearchRequest>()))
                .ReturnsAsync(new SmartSeerSortedBody()
                {
                    Response = new SmartSeerRecommendationsResponseBody()
                    {
                        Elements = new List<SortResponseElements>()
                        {
                            new SortResponseElements() { Id = "Accom1" },
                            new SortResponseElements() { Id = "Accom2" },
                            new SortResponseElements() { Id = "Accom3" },
                            new SortResponseElements() { Id = "Accom4" },
                            new SortResponseElements() { Id = "Accom5" }
                        }
                    }
                });

            string[] requestId = [ids[0]];
            hotelsService
                .Setup(x => x.Search(requestId))
                .ReturnsAsync(new List<Hotel>
                    {
                        new Hotel() { Code = "Accom1", GiataCode = "Accom1" },
                });

            hotelsService
                .Setup(x => x.Search(ids))
                .ReturnsAsync(new List<Hotel>
                    {
                        new Hotel() { Code = "Accom3", GiataCode = "Accom3" },
                        new Hotel() { Code = "Accom5", GiataCode = "Accom5" },
                        new Hotel() { Code = "Accom2", GiataCode = "Accom2" },
                        new Hotel() { Code = "Accom1", GiataCode = "Accom1" },
                        new Hotel() { Code = "Accom4", GiataCode = "Accom4" },
                });

            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .ReturnsAsync(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = "1",
                    MinimumHotelsAvailable = 2,
                    NumberOfRequestedHotelsAtcom = 10,
                    NumberOfRequestedHotelsSmartSeer = 10
                });

            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                        It.IsAny<SearchAvailablePackagesRequest>()))
                .ReturnsAsync(CreateResponse(CreateOffers("Accom5", "Accom2", "Accom4")));

            marketService.Setup(x => x.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
            {
                AirportDepartureCodes = new HashSet<string>()
                {
                    "TestArr",
                }
            });

            var availableAccomsInBd4Order = new List<string> { "Accom2", "Accom4", "Accom5" };

            var request = GetRecommendedRequest();
            request.Destinations = null;
            request.AccomCodes = "Accom1";

            // Act
            var result = await sut.SearchRecommendedOffers(request);

            // Assert
            result.Offers.Select(x => x.Accom.Id).Should().Equal(availableAccomsInBd4Order);
        }

        [Fact]
        public async Task DoDestinationRecommendationRequests_UsesLivePriceSearchSettings()
        {
            // Arrange 
            var request = new PackagesSearchRequest
            {
                AccomCodes = "X9164778,X9141284,X9773241,X9164779,X9860019,X9663558,X9643841",
                Room = new List<RoomAllocation>() { new() { Adults = 1 } }
            };

            var initialSearchOffers = CreateOffers("X9164778", "X9141284", "X9773241", "X9164779", "X9860019", "X9663558", "X9643841");
            initialSearchOffers.ForEach(x => x.Accom.First().Prom = "EUCO");
            initialSearchOffers.ForEach(x => x.Stay = 7);


            searchOffersService
                .Setup(x => x.DoSearch(It.Is<PackagesSearchRequest>(x => x.Duration.First() == 7 && x.Room.First().Adults == 1)))
                .ReturnsAsync((CreateResponse(initialSearchOffers), false));

            var availableCityOffers = CreateOffers("X9164778", "X9141284", "X9773241", "X9164779", "X9860019");
            availableCityOffers.ForEach(x => x.Stay = 3);

            searchOffersService
                .Setup(x => x.DoSearch(It.Is<PackagesSearchRequest>(x => x.Duration.First() == 3 && x.Room.First().Adults == 2)))
                .ReturnsAsync((CreateResponse(availableCityOffers), false));

            var today = DateTime.Today;
            var startOfTheMonth = new DateTime(today.Year, today.Month, 1);
            var periods = new List<DestinationSearch>
                    {
                        new DestinationSearch
                        {
                            DateOfRun = new Period
                            {
                                StartDate = startOfTheMonth,
                                EndDate = startOfTheMonth.AddMonths(1).AddMinutes(-1),
                            },
                            SearchDateRange = new Period
                            {
                                StartDate = startOfTheMonth.AddMonths(1),
                                EndDate = startOfTheMonth.AddMonths(6).AddDays(-1)
                            }
                        }
                    };

            var searches = new List<LivePriceSearch>
            {
                new LivePriceSearch
                {
                    Name = "Beach",
                    NumberOfAdults = 2,
                    DefaultDuration = 7,
                    ChildAges = Array.Empty<string>(),
                    ThemeTypesCodes = new [] {"B"},
                    Periods = periods,
                },
                new LivePriceSearch
                {
                    Name = "City",
                    NumberOfAdults = 2,
                    DefaultDuration = 3,
                    ChildAges = Array.Empty<string>(),
                    ThemeTypesCodes = new [] {"C"},
                    Periods = periods,
                },
            };

            referenceDataService
                .Setup(x => x.GetLivePriceSearches())
                .ReturnsAsync(searches);

            // Act
            var res = await sut.DoDestinationRecommendationRequests(request);

            // Assert
            res.All(x => x.Stay == 3).Should().BeTrue();
            res.Count.Should().Be(availableCityOffers.Count);
        }


        [Fact]
        public async Task Search_NoPromsToIgnore_ReturnsOffers()
        {
            // Arrange 
            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW,LTN",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                IsPromo = false,
                MarketCode = Market.Uk
            };

            var initialSearchOffers = CreateOffers("X9164778", "X9141284", "X9773241", "X9164779", "X9860019", "X9663558", "X9643841");
            initialSearchOffers.ForEach(x => x.Accom.First().Prom = "EUCO");
            initialSearchOffers.ForEach(x => x.Stay = 7);

            searchOffersService
                .Setup(x => x.DoSearch(It.Is<PackagesSearchRequest>(x => x.Duration.First() == 7 && x.Room.First().Adults == 1)))
                .ReturnsAsync((CreateResponse(initialSearchOffers), false));

            // Act
            var res = await sut.Search(request);

            // Assert
            res.Offers.Count.Should().Be(initialSearchOffers.Count);
        }


        [Fact]
        public async Task Search_PromsToIgnore_ReturnsOffers()
        {
            _atcomSettings = CreateAtcomSettings(["EUCO"]);
            var atcomSettingsField = sut.GetType().GetField("_atcomSettings", BindingFlags.NonPublic | BindingFlags.Instance);
            atcomSettingsField?.SetValue(sut, _atcomSettings);

            // Arrange 
            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW,LTN",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                IsPromo = false,
                MarketCode = Market.Uk
            };

            var initialSearchOffers = CreateOffers("X9164778", "X9141284", "X9773241", "X9164779", "X9860019", "X9663558", "X9643841");
            initialSearchOffers.ForEach(x => x.Accom.First().Prom = "EUCO");
            initialSearchOffers.ForEach(x => x.Stay = 7);

            searchOffersService
                .Setup(x => x.DoSearch(It.Is<PackagesSearchRequest>(x => x.Duration.First() == 7 && x.Room.First().Adults == 1)))
                .ReturnsAsync((CreateResponse(initialSearchOffers), false));

            // Act
            var res = await sut.Search(request);

            // Assert
            res.Offers.Count.Should().Be(0);
        }
        
        
        [Fact]
        public async Task Search_PromsToIgnore_Match_ReturnsOffers()
        {
            _atcomSettings = CreateAtcomSettings(["EUCO"]);
            var atcomSettingsField = sut.GetType().GetField("_atcomSettings", BindingFlags.NonPublic | BindingFlags.Instance);
            atcomSettingsField?.SetValue(sut, _atcomSettings);

            // Arrange 
            var request = new PackagesSearchRequest
            {
                StartDate = "2019-01-01",
                FlexibleDays = 3,
                Duration = new List<int> { 7 },
                Departure = "LGW,LTN",
                Geography = "ES",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                IsPromo = false,
                MarketCode = Market.Uk
            };

            var initialSearchOffers = CreateOffers("X9164778", "X9141284", "X9773241", "X9164779", "X9860019", "X9663558", "X9643841");
            initialSearchOffers.ForEach(x => x.Accom.First().Prom = "EUCO");
            initialSearchOffers.ForEach(x => x.Stay = 7);
            initialSearchOffers[0].Accom[0].Prom = "EUCO1"; // This one should match the ignore list

            searchOffersService
                .Setup(x => x.DoSearch(It.Is<PackagesSearchRequest>(x => x.Duration.First() == 7 && x.Room.First().Adults == 1)))
                .ReturnsAsync((CreateResponse(initialSearchOffers), false));

            // Act
            var res = await sut.Search(request);

            // Assert
            res.Offers.Count.Should().Be(1);
        }

        [Fact]
        public async Task OrderFiltersBasedOnPersonalization_FiltersNull_DoesNotCallDependencies()
        {
            // Arrange
            var request = new PackagesSearchRequest
            {
                Destinations = new[] { "country:ES", "region:ESCB" }
            };

            var response = new SearchOffersResponseExtended
            {
                SearchOffersResponse = new SearchOffersResponse
                {
                    Filters = null
                }
            };

            // Act
            await InvokeOrderFiltersBasedOnPersonalization(request, response);

            // Assert
            referenceDataService
                .Verify(x => x.GetOfferFiltersReorderingConfiguration(), Times.Never);
            sitecorePersonalizeService
                .Verify(x => x.GetExperimentFilterOrder(It.IsAny<string>(), It.IsAny<List<string>>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task OrderFiltersBasedOnPersonalization_DisabledConfiguration_KeepsOrderAndSkipsPersonalizeCall()
        {
            // Arrange
            referenceDataService
                .Setup(x => x.GetOfferFiltersReorderingConfiguration())
                .ReturnsAsync(new OfferFiltersReorderingConfiguration
                {
                    IsEnabled = false
                });

            var request = new PackagesSearchRequest
            {
                Destinations = new[] { "country:ES", "region:ESCB" }
            };

            var response = new SearchOffersResponseExtended
            {
                SearchOffersResponse = new SearchOffersResponse
                {
                    Filters = new List<Filter>
                    {
                        new() { Code = AvailableFilters.Board },
                        new() { Code = AvailableFilters.Price },
                        new() { Code = AvailableFilters.Destination }
                    }
                }
            };

            // Act
            await InvokeOrderFiltersBasedOnPersonalization(request, response);

            // Assert
            response.SearchOffersResponse.Filters.Select(x => x.Code)
                .Should()
                .Equal(AvailableFilters.Board, AvailableFilters.Price, AvailableFilters.Destination);
            sitecorePersonalizeService
                .Verify(x => x.GetExperimentFilterOrder(It.IsAny<string>(), It.IsAny<List<string>>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task OrderFiltersBasedOnPersonalization_AttributeNotMapped_KeepsOrder()
        {
            // Arrange
            referenceDataService
                .Setup(x => x.GetOfferFiltersReorderingConfiguration())
                .ReturnsAsync(new OfferFiltersReorderingConfiguration
                {
                    ExperienceId = "exp-id",
                    IsEnabled = true,
                    Filters = new[]
                    {
                        new OfferFilterReordering
                        {
                            Code = "family",
                            FilterOrder = new[] { "price", "boardType", "destination" }
                        }
                    }
                });

            sitecorePersonalizeService
                .Setup(x => x.GetExperimentFilterOrder(
                    "exp-id",
                    It.Is<List<string>>(d =>
                        d.SequenceEqual(new[] { "ES", "ESCB" })),
                    "mobile"))
                .ReturnsAsync("unknown");

            var request = new PackagesSearchRequest
            {
                Destinations = new[] { "country:ES", "region:ESCB" },
                DeviceType = "mobile"
            };

            var response = new SearchOffersResponseExtended
            {
                SearchOffersResponse = new SearchOffersResponse
                {
                    Filters = new List<Filter>
                    {
                        new() { Code = AvailableFilters.Board },
                        new() { Code = AvailableFilters.Price },
                        new() { Code = AvailableFilters.Destination }
                    }
                }
            };

            // Act
            await InvokeOrderFiltersBasedOnPersonalization(request, response);

            // Assert
            response.SearchOffersResponse.Filters.Select(x => x.Code)
                .Should()
                .Equal(AvailableFilters.Board, AvailableFilters.Price, AvailableFilters.Destination);
            sitecorePersonalizeService
                .Verify(x => x.GetExperimentFilterOrder(
                    "exp-id",
                    It.IsAny<IEnumerable<string>>(),
                    "mobile"), Times.Once);
        }

        [Fact]
        public async Task OrderFiltersBasedOnPersonalization_AttributeMapped_ReordersAndRemovesUnconfiguredFilters()
        {
            // Arrange
            referenceDataService
                .Setup(x => x.GetOfferFiltersReorderingConfiguration())
                .ReturnsAsync(new OfferFiltersReorderingConfiguration
                {
                    ExperienceId = "exp-id",
                    IsEnabled = true,
                    Filters = new[]
                    {
                        new OfferFilterReordering
                        {
                            Code = "family",
                            FilterOrder = new[] { "price", "boardType", "unknownCode" }
                        }
                    }
                });

            sitecorePersonalizeService
                .Setup(x => x.GetExperimentFilterOrder("exp-id", It.IsAny<IEnumerable<string>>(), It.IsAny<string>()))
                .ReturnsAsync("family");

            var request = new PackagesSearchRequest
            {
                Destinations = new[] { "country:ES", "region:ESCB" }
            };

            var response = new SearchOffersResponseExtended
            {
                SearchOffersResponse = new SearchOffersResponse
                {
                    Filters = new List<Filter>
                    {
                        new() { Code = AvailableFilters.Board },
                        new() { Code = AvailableFilters.Facilities },
                        new() { Code = AvailableFilters.Price },
                        new() { Code = AvailableFilters.Destination }
                    }
                }
            };

            // Act
            await InvokeOrderFiltersBasedOnPersonalization(request, response);

            // Assert
            response.SearchOffersResponse.Filters.Select(x => x.Code)
                .Should()
                .Equal(AvailableFilters.Price, AvailableFilters.Board);
        }

        [Fact]
        public async Task OrderFiltersBasedOnPersonalization_AttributeMapped_AddsSliderFiltersWhenNotPresent()
        {
            // Arrange
            referenceDataService
                .Setup(x => x.GetOfferFiltersReorderingConfiguration())
                .ReturnsAsync(new OfferFiltersReorderingConfiguration
                {
                    ExperienceId = "exp-id",
                    IsEnabled = true,
                    Filters = new[]
                    {
                        new OfferFilterReordering
                        {
                            Code = "family",
                            FilterOrder = new[] { "priceRange", "flightDuration", "boardType" }
                        }
                    }
                });

            sitecorePersonalizeService
                .Setup(x => x.GetExperimentFilterOrder("exp-id", It.IsAny<IEnumerable<string>>(), It.IsAny<string>()))
                .ReturnsAsync("family");

            var request = new PackagesSearchRequest
            {
                Destinations = new[] { "country:ES", "region:ESCB" }
            };

            var response = new SearchOffersResponseExtended
            {
                SearchOffersResponse = new SearchOffersResponse
                {
                    Filters = new List<Filter>
                    {
                        new() { Code = AvailableFilters.Board, Name = "boardType" },
                        new() { Code = AvailableFilters.Price, Name = "price" }
                    }
                }
            };

            // Act
            await InvokeOrderFiltersBasedOnPersonalization(request, response);

            // Assert
            response.SearchOffersResponse.ReorderFilters.Should().BeTrue();
            response.SearchOffersResponse.Filters.Select(x => x.Code)
                .Should()
                .Equal(AvailableFilters.SitecorePriceRange, AvailableFilters.FlightDuration, AvailableFilters.Board);
            response.SearchOffersResponse.Filters.Select(x => x.Name)
                .Should()
                .Equal("priceRange", "flightDuration", "boardType");
        }

        private List<AvCacheResultOffersOffer> CreateOffers(params string[] accomCodes)
        {
            var offers = accomCodes.Select(x =>
                new AvCacheResultOffersOffer
                {
                    Accom = new[]
                    {
                        new AvCacheResultOffersOfferAccom
                        {
                            Code = x,
                            Unit = new AvCacheResultOffersOfferAccomUnit[]
                            {
                                new AvCacheResultOffersOfferAccomUnit()
                            },
                        }
                    },
                    Transport = new AvCacheResultOffersOfferTransport()
                    {
                        Route = new AvCacheResultOffersOfferTransportRoute[]
                        {
                            new AvCacheResultOffersOfferTransportRoute()
                            {
                                ArrPt = "TestArr",
                                DepPt = "LGW",
                                DepDate = DateTime.UtcNow,
                                ArrDate = DateTime.UtcNow.AddDays(1),
                                DepTime = "1405",
                                ArrTime = "2105",
                            }
                        }
                    }
                }).ToList();

            return offers;
        }

        private SearchAvailablePackagesResponse CreateResponse(IEnumerable<AvCacheResultOffersOffer> offers)
        {
            var response = new SearchAvailablePackagesResponse()
            {
                Payload = new Domain.Models.Api.Payload.XmlApiPayload<AvCache>
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
            };

            return response;
        }

        private async Task InvokeOrderFiltersBasedOnPersonalization(PackagesSearchRequest request, SearchOffersResponseExtended response)
        {
            var method = sut.GetType().GetMethod("OrderFiltersBasedOnPersonalization", BindingFlags.NonPublic | BindingFlags.Instance);
            var task = method?.Invoke(sut, new object[] { request, response }) as Task;
            await task!;
        }

        private RecommendedSearchRequest GetRecommendedRequest(bool withRequestedAmount = false)
        {
            return new RecommendedSearchRequest
            {
                StartDate = "2019-01-01",
                Duration = new List<int> { 7 },
                Departure = "LGW",
                Geography = "ES,ESCB",
                Destinations = new[] { "country:ES", "region:ESCB" },
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation
                    {
                        Adults=1,
                        RoomCode="1BA01"
                    }
                },
                RequestedAmountOfHotels = withRequestedAmount ? "1" : null,
            };
        }

        private IFixture PrepareFixture(out Mock<IApiService> apiService, out Mock<IDestinationsService> destinationService)
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            var atcomSettingsMock = fixture.Freeze<Mock<IOptions<AtcomSettings>>>();
            atcomSettingsMock.Setup(x => x.Value).Returns(_atcomSettings);

            var cacheSettingsMock = fixture.Freeze<Mock<IOptions<CacheSettings>>>();
            cacheSettingsMock.Setup(x => x.Value).Returns(new CacheSettings
            {
                Buckets = new Buckets
                {
                    SearchCache = "S",
                    FacilitiesCache = "F",
                    WeatherData = nameof(CacheSettings.Buckets.WeatherData),
                    PromotionCollections = nameof(CacheSettings.Buckets.PromotionCollections),
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

            fixture.Register<IOffersMapper>(() => fixture.Create<OffersMapper>());

            fixture.Register<ICacheService>(() => new CacheService(
                new TestDistributedCacheImplementation(),
                fixture.Freeze<ILogger<CacheService>>(),
                cacheSettingsMock.Object,
                new JsonSerializationService()
            ));

            var hotelsService = fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetFacilitiesForAccommodations(It.IsAny<string[]>()))
                .ReturnsAsync(new Dictionary<string, List<Facility>>
                {
                    {
                        "qwerty09", new List<Facility>
                        {
                            new Facility
                            {
                                Code = "f01",
                                Name = "Pool"
                            }
                        }
                    }
                });

            apiService = fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(
                        It.IsAny<SearchAvailablePackagesRequest>()))
                .ReturnsAsync(new SearchAvailablePackagesResponse()
                {
                    Payload = new Domain.Models.Api.Payload.XmlApiPayload<AvCache>
                    {
                        Body = new AvCache
                        {
                            Result = new AvCacheResult
                            {
                                Offers = new AvCacheResultOffers
                                {
                                    Offer = new[]
                                    {
                                        new AvCacheResultOffersOffer
                                        {
                                            Accom = new[]
                                            {
                                                new AvCacheResultOffersOfferAccom
                                                {
                                                    Prom = "EUBI",
                                                    Code = "qwerty09",
                                                    Unit = new[]
                                                    {
                                                        new AvCacheResultOffersOfferAccomUnit
                                                        {
                                                            Code = "TW01",
                                                            Board = "FB"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

            destinationService = fixture.Freeze<Mock<IDestinationsService>>();
            destinationService.Setup(service => service.GetPromoDestinations(It.IsAny<Guid>().ToString())).ReturnsAsync(
                new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Code = "ESBA",
                        Type = DestinationItemType.Region,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            }
                        }
                    },
                    new DestinationItem()
                    {
                        Code = "ESDD",
                        Type = DestinationItemType.Region,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            }
                        }
                    },
                });

            var routeAvailabilityMock = fixture.Freeze<Mock<IRouteAvailabilityService>>();
            routeAvailabilityMock.Setup(x => x.GetAvailabilityDates(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<DateTime?>(), It.IsAny<string>())).ReturnsAsync(new DatesAvailability { });

            var refDataMock = fixture.Freeze<Mock<IReferenceDataService>>();
            refDataMock.Setup(x => x.GetFlightFilters()).ReturnsAsync(new List<FlightFilters>());
            refDataMock.Setup(x => x.GetAccommodationToGiataMappings(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new Dictionary<string, string>
                {
                    {"Test1", "Giata1"},
                    {"Test2", "Giata2"}
                });

            var promotionCollectionsService = fixture.Freeze<Mock<IPromotionCollectionsService>>();
            promotionCollectionsService.Setup(pcs => pcs.GetPromotionConfiguration())
                .ReturnsAsync(new PromotionCollections()
                {
                    Promotions = new ReadOnlyCollection<KeyedPromotion>(new List<KeyedPromotion> { new KeyedPromotion("Collection1", "PROMO123,PROMO456", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1") })
                });

            return fixture;
        }

        private static AtcomSettings CreateAtcomSettings(IList<string> promos = default)
        {
            return new AtcomSettings
            {
                AtcomPromoCodesToIgnore = promos,
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
                AnywhereCode = "ALL",
                Transfers = new TransfersSettings(),
                RoomSystemsSettings = new RoomSystemsSettings
                {
                    SystemToDiscard = "HB3",
                    Priorities = new Dictionary<string, int>
                {
                    {"TGX", 1},
                    {"Static", 2}
                }
                }
            };
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
