using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.UserValidation;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Domain.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.UserValidation
{
    public class UserValidationMapperTests
    {
        [Fact]
        public async Task CreateRequest_ShouldReturnValidRequest_WhenInputIsValid()
        {
            // Arrange
            var mockAtcomSettings = new Mock<IOptions<AtcomSettings>>();
            var mockEnvBehaviorSettings = new Mock<IOptions<EnvironmentBehaviourSettings>>();
            var mockCookiesService = new Mock<ICookiesService>();
            var mockLogger = new Mock<ILogger<EndpointsProvider>>();
            var mockTradeAgentAuthService = new Mock<ITradeAgentAuthenticationService>();
            var mockMarketService = new Mock<IMarketService>();
            var mockLanguageService = new Mock<ILanguageService>();
            var mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
            var mockCookies = new Mock<IRequestCookieCollection>();

            mockAtcomSettings.Setup(a => a.Value).Returns(new AtcomSettings
            {
                Booking = new AtcomApiSettings { Host = "http://mockBookingHost", BaseUrl = "/mockBookingBaseUrl" },
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
                CltInfo = new AtcomCltInfoSettings
                {
                    TermCode = "mockTermCode",
                    Channel = "mockChannel",
                    AgentGroups = new Dictionary<string, AtcomCltInfoAgentsSettings>
                    {
                        {
                            "default",
                            new AtcomCltInfoAgentsSettings
                            {
                                AgentsNames = new() {
                                    {"CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                },
                                UserNames = new() {
                                    { "CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                },
                            }
                        }
                    },
                    TradePortalUserName = "mockTradePortalUserName"
                }
            });

            mockEnvBehaviorSettings.Setup(e => e.Value)
                .Returns(new EnvironmentBehaviourSettings { AllowMockCookies = true });

            mockHttpContextAccessor
                .Setup(h => h.HttpContext!.Request.Cookies)
                .Returns(mockCookies.Object);

            var endpointsProvider = new EndpointsProvider(
                mockAtcomSettings.Object,
                mockEnvBehaviorSettings.Object,
                mockCookiesService.Object,
                mockLogger.Object
            );

            var atcomRequestGenerator = new AtcomRequestGenerator(
                mockAtcomSettings.Object,
                mockTradeAgentAuthService.Object,
                mockMarketService.Object,
                mockLanguageService.Object
            );

            var mapper = new UserValidationMapper(
                endpointsProvider,
                atcomRequestGenerator,
                mockHttpContextAccessor.Object
            );

            var userValidationRequest = new UserValidationRequest
            {
                Username = "testUser", Password = "testPassword"
            };

            // Act
            var result = await mapper.CreateRequest(userValidationRequest);

            // Assert
            result.Should().NotBeNull();
            result.Payload.Body.CltInfo.User_Name.Should().Be("testUser");
            result.Payload.Body.UserPwd.Should().Be("testPassword");
            result.Endpoint.Should().Be("http://mockBookingHost/mockBookingBaseUrl");
        }

        [Fact]
        public void CreateRequest_ShouldThrowArgumentNullException_WhenInputIsNull()
        {
            // Arrange
            var mockAtcomSettings = new Mock<IOptions<AtcomSettings>>();
            var mockEnvBehaviorSettings = new Mock<IOptions<EnvironmentBehaviourSettings>>();
            var mockCookiesService = new Mock<ICookiesService>();
            var mockLogger = new Mock<ILogger<EndpointsProvider>>();
            var mockHttpContextAccessor = new Mock<IHttpContextAccessor>();

            mockAtcomSettings.Setup(a => a.Value).Returns(new AtcomSettings
            {
                Booking = new AtcomApiSettings { Host = "http://mockBookingHost", BaseUrl = "/mockBookingBaseUrl" },
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
                CltInfo = new AtcomCltInfoSettings
                {
                    TermCode = "mockTermCode",
                    Channel = "mockChannel",
                    AgentGroups = new(),
                    TradePortalUserName = "mockTradePortalUserName"
                }
            });
            mockEnvBehaviorSettings.Setup(e => e.Value).Returns(new EnvironmentBehaviourSettings());

            var endpointsProvider = new EndpointsProvider(
                mockAtcomSettings.Object,
                mockEnvBehaviorSettings.Object,
                mockCookiesService.Object,
                mockLogger.Object
            );

            var mapper = new UserValidationMapper(
                endpointsProvider,
                null,
                mockHttpContextAccessor.Object
            );

            // Act
            Func<Task> act = async () => await mapper.CreateRequest(null);

            // Assert
            act.Should().ThrowAsync<ArgumentNullException>();
        }

        [Fact]
        public async Task CreateRequest_ShouldSetEndpointCorrectly_WhenCookiesAreProvided()
        {
            // Arrange
            var mockAtcomSettings = new Mock<IOptions<AtcomSettings>>();
            var mockEnvBehaviorSettings = new Mock<IOptions<EnvironmentBehaviourSettings>>();
            var mockCookiesService = new Mock<ICookiesService>();
            var mockLogger = new Mock<ILogger<EndpointsProvider>>();
            var mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
            var mockCookies = new Mock<IRequestCookieCollection>();
            var mockTradeAgentAuthService = new Mock<ITradeAgentAuthenticationService>();
            var mockMarketService = new Mock<IMarketService>();
            var mockLanguageService = new Mock<ILanguageService>();

            mockAtcomSettings.Setup(a => a.Value).Returns(new AtcomSettings
            {
                Booking = new AtcomApiSettings { Host = "http://mockBookingHost", BaseUrl = "/mockBookingBaseUrl" },
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
                CltInfo = new() {
                    AgentGroups = new Dictionary<string, AtcomCltInfoAgentsSettings>
                    {
                        {
                            "default",
                            new AtcomCltInfoAgentsSettings
                            {
                                AgentsNames = new() {
                                    {"CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                },
                                UserNames = new() {
                                    { "CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                },
                            }
                        }
                    },
                    TermCode = "mockTermCode",
                    Channel = "mockChannel",
                    TradePortalUserName = "mockTradePortalUserName",
                },
            });

            mockEnvBehaviorSettings.Setup(e => e.Value)
                .Returns(new EnvironmentBehaviourSettings { AllowMockCookies = true });

            mockHttpContextAccessor
                .Setup(h => h.HttpContext!.Request.Cookies)
                .Returns(mockCookies.Object);

            var endpointsProvider = new EndpointsProvider(
                mockAtcomSettings.Object,
                mockEnvBehaviorSettings.Object,
                mockCookiesService.Object,
                mockLogger.Object
            );

            var atcomRequestGenerator = new AtcomRequestGenerator(
                mockAtcomSettings.Object,
                mockTradeAgentAuthService.Object,
                mockMarketService.Object,
                mockLanguageService.Object
            );

            var mapper = new UserValidationMapper(
                endpointsProvider,
                atcomRequestGenerator,
                mockHttpContextAccessor.Object
            );

            var userValidationRequest = new UserValidationRequest
            {
                Username = "testUser", Password = "testPassword"
            };

            // Act
            var result = await mapper.CreateRequest(userValidationRequest);

            // Assert
            result.Endpoint.Should().Be("http://mockBookingHost/mockBookingBaseUrl");
        }
    }
}