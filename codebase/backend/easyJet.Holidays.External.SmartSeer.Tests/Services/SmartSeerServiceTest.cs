using AutoFixture;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.External.SmartSeer.Api.Services;
using easyJet.Holidays.External.SmartSeer.Models;
using easyJet.Holidays.External.SmartSeer.Services;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.Extensions;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Moq;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Holidays.External.SmartSeer.Tests.Services
{
    public class SmartSeerServiceTest
    {
        private void BuildHttpContext(IFixture _fixture, bool noCookie = false, bool withHeaders = false)
        {
            var headers = new HeaderDictionary(new Dictionary<string, StringValues>() {
                { "Referer",  new StringValues("referer")},
                { "User-Agent",  new StringValues("user-agent")},
                { "cookie", withHeaders ? new StringValues("cookie") : new StringValues("") }
            });

            var cookies = MockRequestCookieCollectionExtension.MockRequestCookieCollectionDictionary("cookie", noCookie ? null : "cookie");

            var requestMock = _fixture.Freeze<Mock<HttpRequest>>();
            requestMock
                .Setup(cm => cm.Headers)
                .Returns(headers);
            requestMock
               .Setup(cm => cm.Cookies)
               .Returns(cookies);
            var contextMock = _fixture.Freeze<Mock<HttpContext>>();
            contextMock
                .SetupGet(c => c.Request)
                .Returns(requestMock.Object);

            var hca = _fixture.Freeze<Mock<IHttpContextAccessor>>();
            hca
                .SetupGet(x => x.HttpContext)
                .Returns(contextMock.Object);
        }

        private void BuildMainServices(IFixture _fixture, bool disableSort = false, bool disableReco = false, int hotelsSmartSeer = 2, int minimumhotels = 1, bool isTradePortal = false)
        {
            var smartSeerSettings = _fixture.Freeze<Mock<IOptions<SmartSeerSettings>>>();
            var atcomSettings = _fixture.Freeze<Mock<IOptions<AtcomSettings>>>();
            var endpointsProvider = _fixture.Freeze<Mock<BaseEndpointsProvider>>();
            var referenceDataService = _fixture.Freeze<Mock<IReferenceDataService>>();
            var envSettings = _fixture.Freeze<Mock<IOptions<EnvironmentBehaviourSettings>>>();
            
            referenceDataService
                .Setup(x => x.GetSmartSeerSettings())
                .Returns(Task.FromResult(new SmartSeerSitecoreSettings()
                {
                    IsRecommendedActiveString = disableReco ? "0" : "1",
                    IsSortActiveString = disableSort ? "0" : "1",
                    NumberOfRequestedHotelsSmartSeer = hotelsSmartSeer,
                    MinimumHotelsAvailable = minimumhotels
                }));

            smartSeerSettings
                .SetupGet(x => x.Value)
                .Returns(new SmartSeerSettings()
                {
                    MarketSpecificSettings = new Dictionary<string, SmartSeerMarketSpecificSettings>
                    {
                        {
                            "UK",
                            new SmartSeerMarketSpecificSettings
                            {
                                TrackingId = "test",
                                Script = "script",
                                Host = "http://test",
                            }
                        },
                        {
                            "TradePortal",
                            new SmartSeerMarketSpecificSettings
                            {
                                TrackingId = "tradeportal",
                                Script = "script",
                                Host = "http://tradeportal",
                            }
                        }
                    },
                    UserIdCookie = "cookie",
                    Api = new SmartSeerApiSettings()
                    {
                        Recommendations = "/reco",
                        Sort = "/sort"
                    },
                    EmptyResponseAllowedFor = ["EmptyResponseGroup"]
                });

            atcomSettings
                .SetupGet(x => x.Value)
                .Returns(new AtcomSettings()
                {
                    AnywhereCode = "ALL"
                });


            envSettings
                .SetupGet(x => x.Value)
                .Returns(new EnvironmentBehaviourSettings()
                {
                    IsTradePortal = isTradePortal
                });
        }

        [Fact]
        public async Task GetSortedHotelCodes_HotelsIdIsNull_Disabled()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(null, new PackagesSearchRequest());

            actual.Response.Should().BeNull();
            actual.TrackingInfo.Should().BeNull();
        }

        [Fact]
        public async Task GetSortedHotelCodes_Disabled_Sorting()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture, true);
            BuildHttpContext(_fixture);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[1] { "test" }, new PackagesSearchRequest { MarketCode = "UK" });

            actual.Response.Should().BeNull();
            actual.TrackingInfo.Should().BeNull();
        }

        [Fact]
        public async Task GetSortedHotelCodes_NoHotels_Sorting()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[0] { }, new PackagesSearchRequest { MarketCode = "UK" });

            actual.Response.Should().BeNull();
            actual.TrackingInfo.Should().BeNull();
        }

        [Fact]
        public async Task GetSortedHotelCodesTradePortal_NoHotels_Sorting()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture, isTradePortal: true);
            BuildHttpContext(_fixture);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[] { "test1" }, new PackagesSearchRequest { MarketCode = "UK" });

            actual.Response.Should().BeNull();
            actual?.TrackingInfo?.ApiMessage.Should().Be("tooFewResults");
            actual?.TrackingInfo?.ApiUrl.Should().Contain("tradeportal/sort");
        }
        
        [Fact]
        public void GetSortedHotelCodesNoSettings_NoHotels_Sorting()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();
            var smartSeerSettings = _fixture.Freeze<Mock<IOptions<SmartSeerSettings>>>();
            var endpointsProvider = _fixture.Freeze<Mock<EndpointsProvider>>();
            var referenceDataService = _fixture.Freeze<Mock<IReferenceDataService>>();
            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var httpContextAccessor = _fixture.Freeze<Mock<IHttpContextAccessor>>();
            var logger = _fixture.Freeze<Mock<ILogger<SmartSeerService>>>();
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            
            smartSeerSettings
                .SetupGet(x => x.Value)
                .Returns(new SmartSeerSettings()
                {
                    MarketSpecificSettings = new Dictionary<string, SmartSeerMarketSpecificSettings>
                    {
                        {
                            "UK",
                            new SmartSeerMarketSpecificSettings
                            {
                                TrackingId = "test",
                                Script = "script",
                                Host = "http://test",
                            }
                        },
                        {
                            "TradePortal",
                            new SmartSeerMarketSpecificSettings
                            {
                                TrackingId = "tradeportal",
                                Script = "script",
                                Host = "http://tradeportal",
                            }
                        }
                    },
                    UserIdCookie = "cookie",
                    Api = new SmartSeerApiSettings()
                    {
                        Recommendations = "/reco",
                        Sort = "/sort"
                    },
                    EmptyResponseAllowedFor = ["EmptyResponseGroup"]
                });

            
            var action = () => new SmartSeerService(
                apiService.Object,
                endpointsProvider.Object,
                httpContextAccessor.Object,
                smartSeerSettings.Object ,
                null,
                logger.Object,
                referenceDataService.Object,
                shortListService.Object,
                authenticationService.Object);
            
            // Act
            action.Should().Throw<ArgumentNullException>();
        }
        
        [Fact]
        public async Task GetSortedHotelCodes_Success_Sorting()
        {   
            var fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(fixture);
            BuildHttpContext(fixture);

            var apiService = fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerSortRequest, SmartSeerSortResponse>(It.IsAny<SmartSeerSortRequest>()))
                .Returns(Task.FromResult(new SmartSeerSortResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerSortResponseBody>()
                    {
                        Body = new SmartSeerSortResponseBody()
                        {
                            Elements = new List<SortResponseElements>()
                            {
                                new SortResponseElements()
                                {
                                    Id = "test",
                                }
                            }
                        }
                    }
                }));
            fixture.Inject(apiService);

            var sut = fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[1] { "test" }, new PackagesSearchRequest { MarketCode = "UK" });

            actual.Response.Elements.Count.Should().Be(1);
            actual.TrackingInfo.ApiMessage.Should().BeNull();
            actual.TrackingInfo.ApiUrl.Should().Be("http://test/sort");
        }

        [Fact]
        public async Task GetSortedHotelCodes_Success_Sorting_Headers()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture, true, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerSortRequest, SmartSeerSortResponse>(It.IsAny<SmartSeerSortRequest>()))
                .Returns(Task.FromResult(new SmartSeerSortResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerSortResponseBody>()
                    {
                        Body = new SmartSeerSortResponseBody()
                        {
                            Elements = new List<SortResponseElements>()
                            {
                                new SortResponseElements()
                                {
                                    Id = "test",
                                }
                            }
                        }
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[1] { "test" }, new PackagesSearchRequest { MarketCode = "UK" });

            actual.Response.Elements.Count.Should().Be(1);
            actual.TrackingInfo.ApiMessage.Should().BeNull();
            actual.TrackingInfo.ApiUrl.Should().Be("http://test/sort");
        }

        [Fact]
        public async Task GetSortedHotelCodes_Sponsored_Request_Disabled_Sorting_SmartSeer()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var referenceDataService = _fixture.Freeze<Mock<IReferenceDataService>>();

            referenceDataService
                .Setup(x => x.GetSponsoredHotelsSettings())
                .Returns(Task.FromResult(new SponsoredHotelsSettingSitecore()
                {
                    IsEnabledString = "0",
                }));

            _fixture.Inject(referenceDataService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[1] { "test" }, new PackagesSearchRequest { MarketCode = "UK" }, false);

            actual.Response.Should().BeNull();
            actual.TrackingInfo.Should().BeNull();
        }

        [Fact]
        public async Task GetSortedHotelCodes_Sponsored_Request_Enabled_Sorting_SmartSeer()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var referenceDataService = _fixture.Freeze<Mock<IReferenceDataService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerSortRequest, SmartSeerSortResponse>(It.IsAny<SmartSeerSortRequest>()))
                .Returns(Task.FromResult(new SmartSeerSortResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerSortResponseBody>()
                    {
                        Body = new SmartSeerSortResponseBody()
                        {
                            Elements = new List<SortResponseElements>()
                            {
                                new SortResponseElements()
                                {
                                    Id = "test",
                                }
                            },
                        }
                    }
                }));

            referenceDataService
                .Setup(x => x.GetSponsoredHotelsSettings())
                .Returns(Task.FromResult(new SponsoredHotelsSettingSitecore()
                {
                    IsEnabledString = "1",
                }));


            _fixture.Inject(apiService);
            _fixture.Inject(referenceDataService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[1] { "test" }, new PackagesSearchRequest { MarketCode = "UK" }, false);

            actual.Response.Elements.Count.Should().Be(1);
            actual.TrackingInfo.ApiMessage.Should().BeNull();
            actual.TrackingInfo.ApiUrl.Should().Be("http://test/sort");
        }

        [Fact]
        public async Task GetSortedHotelCodes_With_Sponsored_Sorting_SmartSeer()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var referenceDataService = _fixture.Freeze<Mock<IReferenceDataService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerSortRequest, SmartSeerSortResponse>(It.IsAny<SmartSeerSortRequest>()))
                .Returns(Task.FromResult(new SmartSeerSortResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerSortResponseBody>()
                    {
                        Body = new SmartSeerSortResponseBody()
                        {
                            Elements = new List<SortResponseElements>()
                            {
                                new SortResponseElements()
                                {
                                    Id = "ESMN0042",
                                    IsSponsored = true,
                                }
                            },
                            Tracking = new SmartSeerTracking()
                            {
                                CampaignId = new List<string>() { "test", "test_1" },
                                CampaignInfo = new List<SmartSeerCampaignInfo>()
                                {
                                    new SmartSeerCampaignInfo()
                                    {
                                        Id = "sponsored_test",
                                        ProductId = "test",
                                        Name = "sponsored_test"
                                    }
                                }
                            }
                        }
                    }
                }));

            referenceDataService
                .Setup(x => x.GetSponsoredHotelsSettings())
                .Returns(Task.FromResult(new SponsoredHotelsSettingSitecore()
                {
                    IsEnabledString = "1",
                }));


            _fixture.Inject(apiService);
            _fixture.Inject(referenceDataService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[1] { "ESMN0042" }, new PackagesSearchRequest { MarketCode = "UK" }, false);

            actual.Response.Elements.Count.Should().Be(1);
            actual.SponsoredHotels.Length.Should().Be(1);
            actual.TrackingInfo.ApiMessage.Should().BeNull();
            actual.TrackingInfo.ApiUrl.Should().Be("http://test/sort");
        }

        [Fact]
        public async Task GetSortedHotelCodes_InvalidaSmartSeerReponse_Sorting()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerSortRequest, SmartSeerSortResponse>(It.IsAny<SmartSeerSortRequest>()))
                .Returns(Task.FromResult(new SmartSeerSortResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerSortResponseBody>()
                    {
                        Body = new SmartSeerSortResponseBody()
                        {
                            Elements = new List<SortResponseElements>() { }
                        }
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[1] { "test" }, new PackagesSearchRequest { MarketCode = "UK" });

            actual.Response.Should().BeNull();
            actual.TrackingInfo.ApiMessage.Should().Be(SmartSeerService.SmartSeerError_TooFewResults);
            actual.TrackingInfo.ApiUrl.Should().Be("http://test/sort");
        }

        [Fact]
        public async Task GetSortedHotelCodes_Failed_SmartSeerError_Sorting()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerSortRequest, SmartSeerSortResponse>(It.IsAny<SmartSeerSortRequest>()))
                .ThrowsAsync(new Exception("something went wrong", new SmartSeerException(System.Net.HttpStatusCode.InternalServerError, null, null)));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[1] { "test" }, new PackagesSearchRequest { MarketCode = "UK" });

            actual.Response.Should().BeNull();
            actual.TrackingInfo.ApiMessage.Should().Be($"{SmartSeerService.SmartSeerError_Http}500");
            actual.TrackingInfo.ApiUrl.Should().Be("http://test/sort");
        }

        [Fact]
        public async Task GetSortedHotelCodes_Failed_Timeout_Sorting()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerSortRequest, SmartSeerSortResponse>(It.IsAny<SmartSeerSortRequest>()))
                .ThrowsAsync(new Exception("something went wrong", new TimeoutException()));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[1] { "test" }, new PackagesSearchRequest { MarketCode = "UK" });

            actual.Response.Should().BeNull();
            actual.TrackingInfo.ApiMessage.Should().Be(SmartSeerService.SmartSeerError_Timeout);
            actual.TrackingInfo.ApiUrl.Should().Be("http://test/sort");
        }

        [Fact]
        public async Task GetSortedHotelCodes_Failed_Other_Sorting()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerSortRequest, SmartSeerSortResponse>(It.IsAny<SmartSeerSortRequest>()))
                .ThrowsAsync(new Exception("something went wrong", new ArgumentException()));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetSortedHotelCodes(new string[1] { "test" }, new PackagesSearchRequest { MarketCode = "UK" });

            actual.Response.Should().BeNull();
            actual.TrackingInfo.ApiMessage.Should().Be(SmartSeerService.SmartSeerError_Other);
            actual.TrackingInfo.ApiUrl.Should().Be("http://test/sort");
        }

        ///-------------Recommended----------///
        [Fact]
        public async Task GetHotelsRecomendations_Disabled_Reco()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture, false, true);
            BuildHttpContext(_fixture);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetHotelsRecomendations(new RecommendedSearchRequest());

            actual.Should().BeNull();
        }

        [Fact]
        public async Task GetHotelsRecomendations_Failed_Other_Sorting()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.IsAny<SmartSeerRecommendationsRequest>()))
                .ThrowsAsync(new Exception("something went wrong", new ArgumentException()));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetHotelsRecomendations(new RecommendedSearchRequest { MarketCode = "UK" });

            actual.Response.Should().BeNull();
            actual.TrackingInfo.ApiMessage.Should().Be(SmartSeerService.SmartSeerError_Other);
            actual.TrackingInfo.ApiUrl.Should().Be("http://test/reco");
        }

        [Fact]
        public async Task GetHotelsRecomendationsTradePortal_Failed_Other_Sorting()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture, isTradePortal: true);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.IsAny<SmartSeerRecommendationsRequest>()))
                .ThrowsAsync(new Exception("something went wrong", new ArgumentException()));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetHotelsRecomendations(new RecommendedSearchRequest { MarketCode = "UK" });

            actual.Response.Should().BeNull();
            actual?.TrackingInfo?.ApiMessage.Should().Be(SmartSeerService.SmartSeerError_Other);
            actual?.TrackingInfo?.ApiUrl.Should().Be("http://tradeportal/reco");
        }
        
        [Fact]
        public async Task GetHotelsRecomendations_Success()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture, false, false, 1, 1);
            BuildHttpContext(_fixture);

            var serializedBody = "{\"userId\":\"cookie\",\"limit\":1,\"context\":{\"reffer\":\"referer\",\"filter\":{\"origin\":[\"LTN\"],\"destination\":[\"country:ES\",\"region:ESDF\",\"resort:ESDFRT\",\"resort:ESDFYU\"],\"tags\":[\"120\"],\"board\":[\"BB\"],\"period\":{\"from\":\"10-10-2020\"},\"duration\":{\"max\":7,\"min\":7},\"categoryStars10\":{\"max\":5,\"min\":3},\"rating10\":{\"min\":4},\"price\":{\"max\":1000.0,\"min\":100.0},\"rooms\":[{\"adults\":1,\"infants\":0,\"children\":[5]}]}}}";

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.Is<SmartSeerRecommendationsRequest>(y =>
                    y.Payload.SerializedBody == serializedBody
                )))
                .Returns(Task.FromResult(new SmartSeerRecommendationsResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerRecommendationsResponseBody>()
                    {
                        Body = new SmartSeerRecommendationsResponseBody()
                        {
                            Elements = new List<SortResponseElements>()
                            {
                                new()
                                {
                                    Id = "test",
                                }
                            },
                            Info = new SmartSeerRecommendationsResponseInfo()
                            {
                                PlacementId = "test"
                            }
                        }
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetHotelsRecomendations(new RecommendedSearchRequest()
            {
                BoardType = "BB",
                DepartureAirport = "LTN",
                Themes = "BL",
                Facilities = "120",
                Duration = new List<int>() { 7 },
                PriceFrom = 100,
                PriceTo = 1000,
                StartDate = "10-10-2020",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation()
                    {
                        Adults = 1,
                        Children = 1,
                        Infants = 0,
                        RoomCode = "Test",
                    }
                },
                ChildAges = "5",
                TripAdvisorRating = 4,
                StarRating = "3,5",
                Geography = "ES,ESDF,ESDFRT|ESDFYU",
                Destinations = new string[] { "country:ES", "region:ESDF", "resort:ESDFRT", "resort:ESDFYU" },
                MarketCode = "UK"
            });

            actual.Response.Elements.Count.Should().Be(1);
            actual.TrackingInfo.ApiMessage.Should().BeNull();
            actual.TrackingInfo.RecoInfo.Should().NotBeNull();
        }

        [Fact]
        public async Task GetHotelsRecomendations_TooFewResults()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture, false, false, 3, 3);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.IsAny<SmartSeerRecommendationsRequest>()))
                .Returns(Task.FromResult(new SmartSeerRecommendationsResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerRecommendationsResponseBody>()
                    {
                        Body = new SmartSeerRecommendationsResponseBody()
                        {
                            Elements = new List<SortResponseElements>()
                            {
                                new()
                                {
                                    Id = "test",
                                }
                            },
                            Info = new SmartSeerRecommendationsResponseInfo()
                            {
                                PlacementId = "test"
                            }
                        }
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetHotelsRecomendations(new RecommendedSearchRequest { MarketCode = "UK" });

            actual.Response.Should().BeNull();
            actual.TrackingInfo.ApiMessage.Should().Be(SmartSeerService.SmartSeerError_TooFewResults);
            actual.TrackingInfo.RecoInfo.Should().NotBeNull();
        }

        [Fact]
        public async Task GetHotelsRecomendations_Success_MinimumHotelsAvailalbe()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture, false, false, 3, 1);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.IsAny<SmartSeerRecommendationsRequest>()))
                .Returns(Task.FromResult(new SmartSeerRecommendationsResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerRecommendationsResponseBody>()
                    {
                        Body = new SmartSeerRecommendationsResponseBody()
                        {
                            Elements = new List<SortResponseElements>()
                            {
                                new()
                                {
                                    Id = "test",
                                }
                            },
                            Info = new SmartSeerRecommendationsResponseInfo()
                            {
                                PlacementId = "test"
                            }
                        }
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetHotelsRecomendations(new RecommendedSearchRequest { MarketCode = "UK" });

            actual.Response.Elements.Count.Should().Be(1);
            actual.TrackingInfo.ApiMessage.Should().BeNull();
            actual.TrackingInfo.RecoInfo.Should().NotBeNull();
        }

        [Fact]
        public async Task GetHotelsRecommendations_HasLoggedInCustomer_RequestContainsShortlistedPackages()
        {
            var fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(fixture, false, false, 3, 1);
            BuildHttpContext(fixture);

            var authServiceMock = fixture.Freeze<Mock<IAuthenticationService>>();
            authServiceMock
                .Setup(x => x.MappedCustomerId(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("1111111");
            fixture.Inject(authServiceMock);

            var shortlistService = fixture.Freeze<Mock<IShortListService>>();
            shortlistService
                .Setup(x => x.GetUserShortList(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest
                    {
                        AccommodationId = "ABC123"
                    }
                ]);
            fixture.Inject(shortlistService);

            var apiService = fixture.Freeze<Mock<IApiService>>();

            var sut = fixture.Create<SmartSeerService>();

            await sut.GetHotelsRecomendations(new RecommendedSearchRequest { MarketCode = "UK" });

            apiService.Verify(x =>
                x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.Is<SmartSeerRecommendationsRequest>(x =>
                    x.Payload.Body.Context.Products.First().Id == "ABC123")));
        }

        [Fact]
        public async Task GetHotelsRecommendations_HasLoggedInCustomer_NoShortlistedPackages_ProductsIsNull()
        {
            var fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(fixture, false, false, 3, 1);
            BuildHttpContext(fixture);

            var authServiceMock = fixture.Freeze<Mock<IAuthenticationService>>();
            authServiceMock
                .Setup(x => x.MappedCustomerId(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("1111111");
            fixture.Inject(authServiceMock);

            var shortlistService = fixture.Freeze<Mock<IShortListService>>();
            shortlistService
                .Setup(x => x.GetUserShortList(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync([]);
            fixture.Inject(shortlistService);

            var apiService = fixture.Freeze<Mock<IApiService>>();

            var sut = fixture.Create<SmartSeerService>();

            await sut.GetHotelsRecomendations(new RecommendedSearchRequest { MarketCode = "UK" });

            apiService.Verify(x =>
                x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.Is<SmartSeerRecommendationsRequest>(x =>
                    x.Payload.Body.Context.Products == null)));
        }

        [Fact]
        public async Task GetHotelsRecommendations_NoLoggedInCustomer_ProductsIsNull()
        {
            var fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(fixture, false, false, 3, 1);
            BuildHttpContext(fixture);

            var authServiceMock = fixture.Freeze<Mock<IAuthenticationService>>();
            authServiceMock
                .Setup(x => x.MappedCustomerId(It.IsAny<CustomerDetails>()))
                .ReturnsAsync(default(string));
            fixture.Inject(authServiceMock);

            var apiService = fixture.Freeze<Mock<IApiService>>();

            var sut = fixture.Create<SmartSeerService>();

            await sut.GetHotelsRecomendations(new RecommendedSearchRequest { MarketCode = "UK" });

            apiService.Verify(x =>
                x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.Is<SmartSeerRecommendationsRequest>(x =>
                    x.Payload.Body.Context.Products == null)));
        }

        [Fact]
        public async Task GetRecommendedDestinations_SmartSeerRecommendationsDisabled_ReturnsEmpty()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture, disableReco: true);
            BuildHttpContext(_fixture);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetRecommendedDestinations(new DestinationsRecommendationRequest { MarketCode = Market.Uk });

            actual.DestinationCodes.Should().BeEmpty();
        }

        [Fact]
        public async Task GetRecommendedDestinations_NoMarketCode_ReturnsEmpty()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetRecommendedDestinations(new DestinationsRecommendationRequest());

            actual.DestinationCodes.Should().BeEmpty();
        }

        [Fact]
        public async Task GetRecommendedDestinations_EmptyResponse_ReturnsEmpty()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.IsAny<SmartSeerRecommendationsRequest>()))
                .ReturnsAsync(new SmartSeerRecommendationsResponse
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerRecommendationsResponseBody>
                    {
                        Body = new SmartSeerRecommendationsResponseBody
                        {
                            Info = new SmartSeerRecommendationsResponseInfo
                            {
                                P13nGroup = "EmptyResponseGroup"
                            },
                            Elements = []
                        }
                    }
                });
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetRecommendedDestinations(new DestinationsRecommendationRequest { MarketCode = Market.Uk });
            actual.DestinationCodes.Should().BeEmpty();
        }

        [Fact]
        public async Task GetRecommendedDestinations_InvalidResponse_ReturnsEmptyResponse()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.IsAny<SmartSeerRecommendationsRequest>()))
                .ReturnsAsync(new SmartSeerRecommendationsResponse
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerRecommendationsResponseBody>
                    {
                        Body = null
                    }
                });
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetRecommendedDestinations(new DestinationsRecommendationRequest { MarketCode = Market.Uk });
            actual.DestinationCodes.Should().BeNull();
        }

        [Fact]
        public async Task GetRecommendedDestinations_ValidResponse_ElementsIdsParsed()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(It.IsAny<SmartSeerRecommendationsRequest>()))
                .ReturnsAsync(new SmartSeerRecommendationsResponse
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerRecommendationsResponseBody>
                    {
                        Body = new SmartSeerRecommendationsResponseBody
                        {
                            Elements =
                            [
                                new SortResponseElements { Id = "reco:region:ESBA" }
                            ]
                        }
                    }
                });
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual = await sut.GetRecommendedDestinations(new DestinationsRecommendationRequest { MarketCode = Market.Uk });
            actual.DestinationCodes.Should().NotBeNull();
            actual.DestinationCodes.Count().Should().Be(1);
            actual.DestinationCodes.First().Should().Be("ESBA");
        }
        
        [Fact]
        public async Task GetRecommendedDestinations_FullResponse_ReturnsResponse()
        {
            var smartSeerResponse =
                "{\n    \"ptoken\": \"oy9U46hB\",\n    \"elements\": [\n        {\n            \"id\": \"reco:ej:EGSS0002\",\n            \"object\": {\n                \"id\": \"EGSS0002\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:EGSS0002\",\n                \"ids\": [\n                    {\n                        \"id\": \"90\",\n                        \"type\": \"giata\"\n                    },\n                    {\n                        \"id\": \"EGSS0002\",\n                        \"type\": \"ej\"\n                    }\n                ]\n            },\n            \"campaigns\": [\n                {\n                    \"id\": \"sponsored_recommender_test_homepage_EGSS0002\",\n                    \"sponsored\": true,\n                    \"sponsor\": \"Baron Resort Sharm El Sheikh\"\n                }\n            ],\n            \"features\": [],\n            \"tracking\": {\n                \"campaignInfo\": [\n                    \"v1#sponsored_recommender_test_homepage_EGSS0002#ej:EGSS0002#RANK#0#availability#5044#0\"\n                ]\n            },\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:TRAN0052\",\n            \"object\": {\n                \"id\": \"TRAN0052\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:TRAN0052\",\n                \"ids\": [\n                    {\n                        \"id\": \"TRAN0052\",\n                        \"type\": \"ej\"\n                    },\n                    {\n                        \"id\": \"900183\",\n                        \"type\": \"giata\"\n                    }\n                ]\n            },\n            \"campaigns\": [\n                {\n                    \"id\": \"sponsored_recommender_test_homepage_TRAN0052\",\n                    \"sponsored\": true,\n                    \"sponsor\": \"Paloma Finesse\"\n                }\n            ],\n            \"features\": [],\n            \"tracking\": {\n                \"campaignInfo\": [\n                    \"v1#sponsored_recommender_test_homepage_TRAN0052#ej:TRAN0052#RANK#0#availability#369#1\"\n                ]\n            },\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:TRAN0062\",\n            \"object\": {\n                \"id\": \"TRAN0062\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:TRAN0062\",\n                \"ids\": [\n                    {\n                        \"id\": \"4931\",\n                        \"type\": \"giata\"\n                    },\n                    {\n                        \"id\": \"TRAN0062\",\n                        \"type\": \"ej\"\n                    }\n                ]\n            },\n            \"campaigns\": [\n                {\n                    \"id\": \"sponsored_recommender_test_homepage_TRAN0062\",\n                    \"sponsored\": true,\n                    \"sponsor\": \"Voyage Sorgun\"\n                }\n            ],\n            \"features\": [],\n            \"tracking\": {\n                \"campaignInfo\": [\n                    \"v1#sponsored_recommender_test_homepage_TRAN0062#ej:TRAN0062#RANK#0#availability#0#0\"\n                ]\n            },\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:TRAN0041\",\n            \"object\": {\n                \"id\": \"TRAN0041\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:TRAN0041\",\n                \"ids\": [\n                    {\n                        \"id\": \"TRAN0041\",\n                        \"type\": \"ej\"\n                    },\n                    {\n                        \"id\": \"187325\",\n                        \"type\": \"giata\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:TRAN0020\",\n            \"object\": {\n                \"id\": \"TRAN0020\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:TRAN0020\",\n                \"ids\": [\n                    {\n                        \"id\": \"187325B\",\n                        \"type\": \"giata\"\n                    },\n                    {\n                        \"id\": \"TRAN0020\",\n                        \"type\": \"ej\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:X9067625\",\n            \"object\": {\n                \"id\": \"X9067625\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:X9067625\",\n                \"ids\": [\n                    {\n                        \"id\": \"X9067625\",\n                        \"type\": \"ej\"\n                    },\n                    {\n                        \"id\": \"70520\",\n                        \"type\": \"giata\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:TRAN0131\",\n            \"object\": {\n                \"id\": \"TRAN0131\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:TRAN0131\",\n                \"ids\": [\n                    {\n                        \"id\": \"TRAN0131\",\n                        \"type\": \"ej\"\n                    },\n                    {\n                        \"id\": \"1398350\",\n                        \"type\": \"giata\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:X1029225\",\n            \"object\": {\n                \"id\": \"X1029225\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:X1029225\",\n                \"ids\": [\n                    {\n                        \"id\": \"1426732\",\n                        \"type\": \"giata\"\n                    },\n                    {\n                        \"id\": \"X1029225\",\n                        \"type\": \"ej\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:X9161752\",\n            \"object\": {\n                \"id\": \"X9161752\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:X9161752\",\n                \"ids\": [\n                    {\n                        \"id\": \"240031\",\n                        \"type\": \"giata\"\n                    },\n                    {\n                        \"id\": \"X9161752\",\n                        \"type\": \"ej\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:X9188748\",\n            \"object\": {\n                \"id\": \"X9188748\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:X9188748\",\n                \"ids\": [\n                    {\n                        \"id\": \"300709\",\n                        \"type\": \"giata\"\n                    },\n                    {\n                        \"id\": \"X9188748\",\n                        \"type\": \"ej\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:X9559901\",\n            \"object\": {\n                \"id\": \"X9559901\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:X9559901\",\n                \"ids\": [\n                    {\n                        \"id\": \"X9559901\",\n                        \"type\": \"ej\"\n                    },\n                    {\n                        \"id\": \"632778\",\n                        \"type\": \"giata\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:TRAN0030\",\n            \"object\": {\n                \"id\": \"TRAN0030\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:TRAN0030\",\n                \"ids\": [\n                    {\n                        \"id\": \"229489\",\n                        \"type\": \"giata\"\n                    },\n                    {\n                        \"id\": \"TRAN0030\",\n                        \"type\": \"ej\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:TRAN0036\",\n            \"object\": {\n                \"id\": \"TRAN0036\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:TRAN0036\",\n                \"ids\": [\n                    {\n                        \"id\": \"TRAN0036\",\n                        \"type\": \"ej\"\n                    },\n                    {\n                        \"id\": \"403253\",\n                        \"type\": \"giata\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:region:ESMJ\",\n            \"object\": {\n                \"id\": \"ESMJ\",\n                \"idType\": \"region\",\n                \"fullyQualifiedId\": \"region:ESMJ\",\n                \"name\": \"Majorca\"\n            },\n            \"userMatch\": {\n                \"recoMatch\": 0.9989885,\n                \"dnaMatch\": 504.429444877212\n            }\n        },\n        {\n            \"id\": \"reco:ej:ESCB0043\",\n            \"object\": {\n                \"id\": \"ESCB0043\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:ESCB0043\",\n                \"ids\": [\n                    {\n                        \"id\": \"5843B\",\n                        \"type\": \"giata\"\n                    },\n                    {\n                        \"id\": \"ESCB0043\",\n                        \"type\": \"ej\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:ESMJ0039\",\n            \"object\": {\n                \"id\": \"ESMJ0039\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:ESMJ0039\",\n                \"ids\": [\n                    {\n                        \"id\": \"6675\",\n                        \"type\": \"giata\"\n                    },\n                    {\n                        \"id\": \"ESMJ0039\",\n                        \"type\": \"ej\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:X9191371\",\n            \"object\": {\n                \"id\": \"X9191371\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:X9191371\",\n                \"ids\": [\n                    {\n                        \"id\": \"X9191371\",\n                        \"type\": \"ej\"\n                    },\n                    {\n                        \"id\": \"57975\",\n                        \"type\": \"giata\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        },\n        {\n            \"id\": \"reco:ej:X9185291\",\n            \"object\": {\n                \"id\": \"X9185291\",\n                \"idType\": \"ej\",\n                \"fullyQualifiedId\": \"ej:X9185291\",\n                \"ids\": [\n                    {\n                        \"id\": \"284853\",\n                        \"type\": \"giata\"\n                    },\n                    {\n                        \"id\": \"X9185291\",\n                        \"type\": \"ej\"\n                    }\n                ]\n            },\n            \"campaigns\": [],\n            \"features\": [],\n            \"info\": {}\n        }\n    ],\n    \"info\": {\n        \"recosEngagedWithBefore\": [\n            \"region:ESMJ\",\n            \"ej:EGSS0002\",\n            \"ej:TRAN0062\"\n        ],\n        \"lastUserEvent\": \"bd4reco_loaded_home@2025-08-29T09:08:30.813Z\",\n        \"placementId\": \"ejh-reco-homepage-sponsored\",\n        \"modelId\": \"reco\",\n        \"campaignInfo\": [\n            \"v1#sponsored_recommender_test_homepage_EGSS0002#ej:EGSS0002#RANK#0#availability#5044#0\",\n            \"v1#sponsored_recommender_test_homepage_TRAN0052#ej:TRAN0052#RANK#0#availability#369#1\",\n            \"v1#sponsored_recommender_test_homepage_TRAN0062#ej:TRAN0062#RANK#0#availability#0#0\"\n        ],\n        \"strategy\": \"collab\",\n        \"ptoken\": \"oy9U46hB\"\n    },\n    \"issues\": [\n        {\n            \"message\": \"context: Missing 'type', assuming 'generic'\"\n        },\n        {\n            \"message\": \"context: Missing 'section' value\"\n        }\n    ],\n    \"responseTimestamp\": \"2025-08-29T09:13:29.035475469Z\"\n}";

            var payloadBody = JsonConvert.DeserializeObject<SmartSeerRecommendationsResponseBody>(smartSeerResponse);
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            BuildHttpContext(_fixture);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(
                        It.IsAny<SmartSeerRecommendationsRequest>()))
                .ReturnsAsync(new SmartSeerRecommendationsResponse
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<SmartSeerRecommendationsResponseBody>
                    {
                        Body = payloadBody
                    }
                });
            _fixture.Inject(apiService);

            var sut = _fixture.Create<SmartSeerService>();

            var actual =
                await sut.GetHotelsRecomendations(new RecommendedSearchRequest { MarketCode = "UK" });
            actual.Response.Should().NotBeNull();
            actual.Response?.Elements.Count.Should().Be(18);
            actual.Response?.Elements[0].IsSponsored.Should().BeTrue();
            actual.Response?.Elements[1].IsSponsored.Should().BeTrue();
            actual.Response?.Elements[2].IsSponsored.Should().BeTrue();
            actual.Response?.Elements[3].IsSponsored.Should().BeFalse();
        }
    }
}
