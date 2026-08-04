using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using easyJet.Feature.Tracker.Logging;
using easyJet.Feature.Tracker.Models.Personalize;
using easyJet.Feature.Tracker.Services.Personalize;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Services
{
    public class PersonalizationServiceTests
    {
        private const string MarketChannelPersonalizationCookieName = "MarketChannelPersonalizationCookie";
        private const string Bid = "test-bid-test";
        private readonly IMarketSettingsService marketSettingsService = Substitute.For<IMarketSettingsService>();
        private readonly IHttpClientProvider httpClientProvider = Substitute.For<IHttpClientProvider>();
        private readonly ICustomCacheRepository customCacheRepository = Substitute.For<ICustomCacheRepository>();
        private readonly IHttpContextAccessor httpContextAccessor = Substitute.For<IHttpContextAccessor>();
        private readonly IDatabaseProvider databaseProvider = Substitute.For<IDatabaseProvider>();
        private readonly ITrackerLogger trackerLogger = Substitute.For<ITrackerLogger>();
        private readonly IPersonalizeService personalizeService;

        public PersonalizationServiceTests()
        {
            var httpContext = MockHttpContext(Bid);
            httpContextAccessor.GetCurrent().Returns(httpContext);
            httpContextAccessor.GetRequestCookieValue(Arg.Any<string>()).Returns(Bid);

            var item = new FakeItem().WithField("SitecorePersonalizeTimeout", "1000").ToSitecoreItem();
            databaseProvider.GetItem(Arg.Any<string>()).Returns(item);

            using (new SettingsSwitcher("Personalize.ClientKey", $"{Bid}"))
            {
                personalizeService = new PersonalizeService(marketSettingsService, httpClientProvider, customCacheRepository, httpContextAccessor, databaseProvider, trackerLogger);
            }
        }

        [Fact]
        public async Task GetMarketingChannelPersonalizedExperience_Success()
        {
            var expectedResult = "test-mc";
            var experienceName = "test-mc";

            var httpContext = MockHttpContextWithQuery(Bid, true);
            var httpContextAccessorMock = Substitute.For<IHttpContextAccessor>();
            httpContextAccessorMock.GetCurrent().Returns(httpContext);
            httpContextAccessorMock.GetRequestCookieValue(Arg.Any<string>()).Returns(Bid);
            var personalizeRequest = GetPersonalizeRequest(experienceName);
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, string.Empty)
            {
                Content = new StringContent(JsonConvert.SerializeObject(personalizeRequest), Encoding.UTF8, "application/json"),
            };
            var response = new PersonalizeResult
            {
                IsPreview = false, SelectionAttribute = expectedResult,
            };

            httpClientProvider.SendAsync(Arg.Is<HttpRequestMessage>(m => m.Content.ReadAsStringAsync().Result == requestMessage.Content.ReadAsStringAsync().Result)).Returns(Task.FromResult(new HttpResponseMessage(HttpStatusCode.Accepted) { Content = new StringContent(JsonConvert.SerializeObject(response)) }));

            var personalizeServiceMock = new PersonalizeService(marketSettingsService, httpClientProvider, customCacheRepository, httpContextAccessorMock, databaseProvider, trackerLogger);
            var result = await personalizeServiceMock.GetPersonalizedExperience(experienceName, 1).ConfigureAwait(false);
            result.SelectionAttribute.Should().BeEquivalentTo(expectedResult);
            result.IsPreview.Should().BeFalse();
        }

        [Fact]
        public async Task GetPersonalization_Success_GetFromCache()
        {
            var expectedResult = "test-cache";
            customCacheRepository.ClearReceivedCalls();
            customCacheRepository.GetItem<PersonalizeResult>(Arg.Any<string>()).Returns(new PersonalizeResult { SelectionAttribute = expectedResult });

            var result = await personalizeService.GetPersonalizedExperience("test-cache", 1).ConfigureAwait(false);
            result.SelectionAttribute.Should().BeEquivalentTo(expectedResult);
            result.IsPreview.Should().BeFalse();
            result.Ctas.Should().BeEmpty();
        }

        [Fact]
        public async Task GetPersonalizationCtasAreNotConfigured_Success_GetFromApiCall()
        {
            var expectedResult = "test-suc";
            var experienceName = "test-s";
            var cacheKey = $"{experienceName}-{Bid}";
            var response = new PersonalizeResultMock { IsPreview = false, SelectionAttribute = expectedResult };
            httpClientProvider.SendAsync(Arg.Any<HttpRequestMessage>()).Returns(Task.FromResult(new HttpResponseMessage(HttpStatusCode.Accepted) { Content = new StringContent(JsonConvert.SerializeObject(response)) }));

            var result = await personalizeService.GetPersonalizedExperience(experienceName, 1).ConfigureAwait(false);
            result.SelectionAttribute.Should().BeEquivalentTo(expectedResult);
            result.IsPreview.Should().BeFalse();
            result.Ctas.Should().BeEmpty();
            customCacheRepository.Received(1).StoreItem(cacheKey, result, 1);
        }

        [Fact]
        public async Task GetPersonalization_Success_GetFromApiCall()
        {
            var expectedResult = "test-suc";
            var experienceName = "test-s";
            var cacheKey = $"{experienceName}-{Bid}";
            var response = new PersonalizeResult { IsPreview = false, SelectionAttribute = expectedResult, Ctas = new[] { new PersonalizedCta() { Token = "token", Url = "url/test" } } };
            httpClientProvider.SendAsync(Arg.Any<HttpRequestMessage>()).Returns(Task.FromResult(new HttpResponseMessage(HttpStatusCode.Accepted) { Content = new StringContent(JsonConvert.SerializeObject(response)) }));

            var result = await personalizeService.GetPersonalizedExperience(experienceName, 1).ConfigureAwait(false);
            result.SelectionAttribute.Should().BeEquivalentTo(expectedResult);
            result.IsPreview.Should().BeFalse();
            result.Ctas.Length.Should().Be(1);
            result.Ctas[0].Token.Should().Be(response.Ctas[0].Token);
            result.Ctas[0].Url.Should().Be(response.Ctas[0].Url);
            customCacheRepository.Received(1).StoreItem(cacheKey, result, 1);
        }

        [Fact]
        public async Task GetPersonalization_Failure_DefaultResult()
        {
            var experienceName = "test-f";
            var cacheKey = $"{experienceName}-{Bid}";
            var expectedResult = new PersonalizeResult();
            httpClientProvider.SendAsync(Arg.Any<HttpRequestMessage>()).Returns(Task.FromResult(new HttpResponseMessage(HttpStatusCode.Accepted)));

            var result = await personalizeService.GetPersonalizedExperience(experienceName, 1).ConfigureAwait(false);
            result.SelectionAttribute.Should().BeEquivalentTo(expectedResult.SelectionAttribute);
            result.IsPreview.Should().BeFalse();
            result.Ctas.Should().BeEmpty();
            customCacheRepository.Received(1).StoreItem(cacheKey, result, 1);
            trackerLogger.Received(1).Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public async Task GetPersonalization_IsPreview_DefaultResult()
        {
            var mockAttribute = "test-fail";
            var experienceName = "test-f";
            var cacheKey = $"{experienceName}-{Bid}";
            var response = new PersonalizeResult { IsPreview = true, SelectionAttribute = mockAttribute };
            var expectedResult = new PersonalizeResult();
            httpClientProvider.SendAsync(Arg.Any<HttpRequestMessage>()).Returns(Task.FromResult(new HttpResponseMessage(HttpStatusCode.Accepted) { Content = new StringContent(JsonConvert.SerializeObject(response)) }));

            var result = await personalizeService.GetPersonalizedExperience(experienceName, 1).ConfigureAwait(false);
            result.SelectionAttribute.Should().BeEquivalentTo(expectedResult.SelectionAttribute);
            result.IsPreview.Should().BeFalse();
            result.Ctas.Should().BeEmpty();
            customCacheRepository.Received(1).StoreItem(cacheKey, result, 1);
        }

        [Fact]
        public async Task GetPersonalization_IsPreview_AttributeFromQuery()
        {
            var mockAttribute = "test";
            var experienceName = "test-f";

            var httpContext = MockHttpContextWithQuery(Bid);
            var httpContextAccessorMock = Substitute.For<IHttpContextAccessor>();
            httpContextAccessorMock.GetRequestCookieValue(Arg.Any<string>()).Returns(Bid);
            httpContextAccessorMock.GetCurrent().Returns(httpContext);

            using (new SettingsSwitcher("Personalize.ClientKey", $"{Bid}"))
            {
                var personalizeServiceMock = new PersonalizeService(marketSettingsService, httpClientProvider, customCacheRepository, httpContextAccessorMock, databaseProvider, trackerLogger);
                var result = await personalizeServiceMock.GetPersonalizedExperience(experienceName, 1).ConfigureAwait(false);
                result.SelectionAttribute.Should().BeEquivalentTo(mockAttribute);
                result.IsPreview.Should().BeFalse();
                result.Ctas.Should().BeEmpty();
            }
        }

        [Fact]
        public async Task GetPersonalization_IsPreviewDiffExperiment_AttributeFromCache()
        {
            var experienceName = "test-b";
            var expectedResult = "test-not-cache";

            var httpContext = MockHttpContextWithQuery(Bid);
            var httpContextAccessorMock = Substitute.For<IHttpContextAccessor>();
            httpContextAccessorMock.GetCurrent().Returns(httpContext);
            httpContextAccessorMock.GetRequestCookieValue(Arg.Any<string>()).Returns(Bid);
            customCacheRepository.GetItem<PersonalizeResult>(Arg.Any<string>()).Returns(new PersonalizeResult { SelectionAttribute = expectedResult });

            using (new SettingsSwitcher("Personalize.ClientKey", $"{Bid}"))
            {
                var personalizeServiceMock = new PersonalizeService(marketSettingsService, httpClientProvider, customCacheRepository, httpContextAccessorMock, databaseProvider, trackerLogger);
                var result = await personalizeServiceMock.GetPersonalizedExperience(experienceName, 1).ConfigureAwait(false);
                result.SelectionAttribute.Should().BeEquivalentTo(expectedResult);
                result.IsPreview.Should().BeFalse();
                result.Ctas.Should().BeEmpty();
            }
        }

        [Fact]
        public async Task GetPersonalization_NoBid_DefaultResult()
        {
            var experienceName = "test-f";
            var expectedResult = new PersonalizeResult();

            var httpContext = new HttpContext(new HttpRequest($"", "http://test.test", $""), new HttpResponse(new StringWriter()));
            var httpContextAccessorMock = Substitute.For<IHttpContextAccessor>();
            httpContextAccessorMock.GetCurrent().Returns(httpContext);

            using (new SettingsSwitcher("Personalize.ClientKey", $"{Bid}"))
            {
                var personalizeServiceMock = new PersonalizeService(marketSettingsService, httpClientProvider, customCacheRepository, httpContextAccessorMock, databaseProvider, trackerLogger);
                var result = await personalizeServiceMock.GetPersonalizedExperience(experienceName, 1).ConfigureAwait(false);
                result.SelectionAttribute.Should().BeEquivalentTo(expectedResult.SelectionAttribute);
                result.IsPreview.Should().BeFalse();
                result.Ctas.Should().BeEmpty();
            }
        }

        [Fact]
        public async Task GetPersonalization_ThrowTimeoutError_DefaultResult()
        {
            var experienceName = "test-f";
            var cacheKey = $"{experienceName}-{Bid}";
            var expectedResult = new PersonalizeResult();
            httpClientProvider.SendAsync(Arg.Any<HttpRequestMessage>()).Returns<Task<HttpResponseMessage>>(x => throw new TimeoutException());

            var result = await personalizeService.GetPersonalizedExperience(experienceName, 1).ConfigureAwait(false);
            result.SelectionAttribute.Should().BeEquivalentTo(expectedResult.SelectionAttribute);
            result.IsPreview.Should().BeFalse();
            result.Ctas.Should().BeEmpty();
            customCacheRepository.Received(1).StoreItem(cacheKey, result, 1);
            trackerLogger.Received(1).Error(Arg.Any<string>(), Arg.Any<TimeoutException>(), Arg.Any<object>());
        }

        [Fact]
        public void SetTimeout_SettingsExists()
        {
            var httpClientProviderOverride = new HttpClientProvider();
            using (new SettingsSwitcher("Personalize.ClientKey", $"{Bid}"))
            {
                _ = new PersonalizeService(marketSettingsService, httpClientProviderOverride, customCacheRepository, httpContextAccessor, databaseProvider, trackerLogger);
                httpClientProviderOverride.GetClient().Timeout.Should().Be(TimeSpan.FromMilliseconds(1000));
            }
        }

        [Fact]
        public void SetTimeout_SettingsEmpty()
        {
            var httpClientProviderOverride = new HttpClientProvider();
            var databaseProvideOverride = Substitute.For<IDatabaseProvider>();
            Item nullItem = null;
            databaseProvideOverride.GetItem(Arg.Any<string>()).Returns(nullItem);
            using (new SettingsSwitcher("Personalize.ClientKey", $"{Bid}"))
            {
                _ = new PersonalizeService(marketSettingsService, httpClientProviderOverride, customCacheRepository, httpContextAccessor, databaseProvideOverride, trackerLogger);
                httpClientProviderOverride.GetClient().Timeout.Should().Be(TimeSpan.FromMilliseconds(400));
            }
        }

        private static PersonalizeRequest GetPersonalizeRequest(string experienceName)
        {
            var request = new PersonalizeRequest
            {
                BrowserId = Bid,
                ClientKey = Bid,
                Channel = "WEB",
                Language = null,
                CurrencyCode = null,
                FriendlyId = experienceName,
                PointOfSale = "default",
            };

            request.CustomParameters.Add("isLoggedIn", true);
            request.CustomParameters.Add("marketingChannelCampaignName", "20250416_PROMO_HOTELS_EM_UK_braze_easyJet");

            return request;
        }

        private static HttpContext MockHttpContext(string bid)
        {
            var httpRequest = new HttpRequest($"", "http://tempuri.org", $"");
            httpRequest.GetType().GetField("_cookies", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(httpRequest, new HttpCookieCollection { new HttpCookie($"bid_{bid}", bid) });

            var httpContext = new HttpContext(httpRequest, new HttpResponse(new StringWriter()));
            return httpContext;
        }

        private static HttpContext MockHttpContextWithQuery(string bid, bool withMarketingParameter = false)
        {
            HttpRequest httpRequest;
            if (withMarketingParameter)
            {
                httpRequest = new HttpRequest($"", "http://tempuri.org?lid=39oxqijhzyg6&Campaign_name=20250416_PROMO_HOTELS_EM_UK&utm_source=braze&utm_medium=email&utm_campaign=20250416_PROMO_HOTELS_EM_UK_braze_easyJet", $"");
            }
            else
            {
                httpRequest = new HttpRequest($"", "http://tempuri.org?isPreview=true&experienceId=test-f&selectionAttr=test", $"");
            }

            httpRequest.GetType().GetField("_cookies", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(httpRequest, new HttpCookieCollection { new HttpCookie($"bid_{bid}", bid) });
            var httpContext = new HttpContext(httpRequest, new HttpResponse(new StringWriter()));
            return httpContext;
        }

        public class PersonalizeResultMock
        {
            private const string DefaultResult = "Default";

            [JsonProperty("selectionAttr")]
            public string SelectionAttribute { get; set; } = DefaultResult;

            [JsonProperty("isPreview")]
            public bool IsPreview { get; set; }
        }
    }
}
