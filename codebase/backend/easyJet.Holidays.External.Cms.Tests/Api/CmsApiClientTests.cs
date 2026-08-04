using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Api;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Cms.Tests.Api
{
    public class CmsApiClientTests
    {
        private Mock<ITradeAgentAuthenticationService> _tradeAgentAuthServiceMock = new Mock<ITradeAgentAuthenticationService>();
        AgentDetails agentDetails = new AgentDetails { Number = "12345", Name = "qwe" };

        [Fact]
        public async Task AddTradePortalHeaderToHttpRequest()
        {
            // Arrange
            _tradeAgentAuthServiceMock.Setup(x => x.GetCurrentAgent()).Returns(agentDetails);
            _tradeAgentAuthServiceMock.Setup(service => service.IsTradePortalEnv()).Returns(true);
            var cmsSettings = Options.Create(new CmsSettings()
            {
                Api = new CmsApiSettings
                {
                    TradePortalHeaderKey = "XTPkey",
                    TradePortalHeaderValue = "XTPValue"
                }
            });

            IHttpContextAccessor httpContext = new HttpContextAccessor();
            httpContext.HttpContext = new DefaultHttpContext();
            var httpRequest = new HttpRequestMessage();

            // Act
            await new CmsApiClient(new HttpClient(), Options.Create(new EnvironmentBehaviourSettings() { IsTradePortal = true }), cmsSettings, null, null).PrepareRequestMessage(httpRequest);

            Assert.NotNull(httpRequest);
            Assert.NotNull(httpRequest.Headers);
            Assert.NotEmpty(httpRequest.Headers);
            Assert.True(httpRequest.Headers.Contains("XTPkey"));
        }

        [Fact]
        public async Task TradePortalHeaderIsNotPresentInHttpRequest()
        {
            // Arrange
            _tradeAgentAuthServiceMock.Setup(x => x.GetCurrentAgent()).Returns<AgentDetails>(null);
            var cmsSettings = Options.Create(new CmsSettings()
            {
                Api = new CmsApiSettings
                {
                    TradePortalHeaderKey = "XTPkey",
                    TradePortalHeaderValue = "XTPValue"
                }
            });

            IHttpContextAccessor httpContext = new HttpContextAccessor();
            httpContext.HttpContext = new DefaultHttpContext();
            httpContext.HttpContext.Request.Cookies = MockRequestCookieCollection(
                new string[] { "first", "second", "notallowed" },
                new string[] { "value", "value", "value" });
            var httpRequest = new HttpRequestMessage();

            // Act
            await new CmsApiClient(new HttpClient(), Options.Create(new EnvironmentBehaviourSettings()), cmsSettings, null, null).PrepareRequestMessage(httpRequest);

            Assert.NotNull(httpRequest);
            Assert.False(httpRequest.Headers.Contains("XTPkey"));
        }

        [Fact]
        public async Task AddsOptimizelyUserIdCookieToCmsRequestWhenPresentInIncomingRequest()
        {
            // Arrange
            const string cookieName = "optimizelyUserId";
            const string cookieValue = "opt-user-123";

            var cmsSettings = Options.Create(new CmsSettings());
            var cookiesSettings = Options.Create(new CookiesSettings { OptimizelyUserId = cookieName });

            IHttpContextAccessor httpContext = new HttpContextAccessor();
            httpContext.HttpContext = new DefaultHttpContext();
            httpContext.HttpContext.Request.Cookies = MockRequestCookieCollection(
                new string[] { cookieName },
                new string[] { cookieValue });

            var httpRequest = new HttpRequestMessage();

            // Act
            await new CmsApiClient(
                new HttpClient(),
                Options.Create(new EnvironmentBehaviourSettings()),
                cmsSettings,
                cookiesSettings,
                null,
                httpContext).PrepareRequestMessage(httpRequest);

            // Assert
            Assert.True(httpRequest.Headers.TryGetValues(HeaderNames.Cookie, out var cookieHeaderValues));
            Assert.Contains($"{cookieName}={cookieValue}", cookieHeaderValues);
        }

        [Fact]
        public async Task DoesNotAddOptimizelyUserIdCookieToCmsRequestWhenMissingInIncomingRequest()
        {
            // Arrange
            var cmsSettings = Options.Create(new CmsSettings());
            var cookiesSettings = Options.Create(new CookiesSettings { OptimizelyUserId = "optimizelyUserId" });

            IHttpContextAccessor httpContext = new HttpContextAccessor();
            httpContext.HttpContext = new DefaultHttpContext();

            var httpRequest = new HttpRequestMessage();

            // Act
            await new CmsApiClient(
                new HttpClient(),
                Options.Create(new EnvironmentBehaviourSettings()),
                cmsSettings,
                cookiesSettings,
                null,
                httpContext).PrepareRequestMessage(httpRequest);

            // Assert
            Assert.False(httpRequest.Headers.Contains(HeaderNames.Cookie));
        }

        private static IRequestCookieCollection MockRequestCookieCollection(string[] keys, string[] values)
        {
            var requestFeature = new HttpRequestFeature();
            var featureCollection = new FeatureCollection();

            requestFeature.Headers = new HeaderDictionary();

            string[] cookie = new string[keys.Length];
            for (int i = 0; i < keys.Length; i++)
            {
                cookie[i] = $"{keys[i]}={values[i]}";
            }
            requestFeature.Headers.Add(HeaderNames.Cookie, string.Join("; ", cookie));

            featureCollection.Set<IHttpRequestFeature>(requestFeature);

            var cookiesFeature = new RequestCookiesFeature(featureCollection);

            return cookiesFeature.Cookies;
        }
    }
}
