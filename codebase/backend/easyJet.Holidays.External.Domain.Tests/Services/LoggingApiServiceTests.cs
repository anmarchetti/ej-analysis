using AutoFixture;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Microsoft.Net.Http.Headers;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Domain.Tests.Services
{
    public class LoggingApiServiceTests
    {
        [Theory]
#pragma warning disable xUnit1045 // Avoid using TheoryData type arguments that might not be serializable
        [MemberData(nameof(FormatResponseBodyData))]
#pragma warning restore xUnit1045 // Avoid using TheoryData type arguments that might not be serializable
        public void FormatResponseBody(ApiSettings apiSettings, string queryString, IRequestCookieCollection cookies, string message, string expectedValue)
        {
            // Arrange
            var fixture = PrepareFixture(apiSettings, cookies);
            var sut = fixture.Create<LoggingApiService>();

            var request = new SearchAvailablePackagesRequest();
            request.SetQueryString(queryString);

            // Act 
            var result = sut.FormatResponseBody(request, message);

            // Assert
            result.Should().Be(expectedValue);
        }

        private IFixture PrepareFixture(ApiSettings apiSettings, IRequestCookieCollection cookies)
        {
            var fixture = FixtureUtils.AutoMoqFixture();

            var nlogSettingsMock = fixture.Freeze<Mock<IOptions<ApiSettings>>>();
            nlogSettingsMock.Setup(x => x.Value).Returns(apiSettings);

            var httpContextAccessor = fixture.Freeze<Mock<IHttpContextAccessor>>();
            httpContextAccessor.Setup(x => x.HttpContext.Request.Cookies).Returns(cookies);

            return fixture;
        }

        private static IRequestCookieCollection MockRequestCookieCollection(string key, string value)
        {
            var requestFeature = new HttpRequestFeature();
            var featureCollection = new FeatureCollection();

            requestFeature.Headers = new HeaderDictionary();
            requestFeature.Headers.Add(HeaderNames.Cookie, new StringValues(key + "=" + value));

            featureCollection.Set<IHttpRequestFeature>(requestFeature);

            var cookiesFeature = new RequestCookiesFeature(featureCollection);

            return cookiesFeature.Cookies;
        }

        public static TheoryData<ApiSettings, string, IRequestCookieCollection, string, string>
            FormatResponseBodyData =>
            new()
            {
                {
                    new ApiSettings
                    {
                        Logging = new LoggingSettings
                        {
                            DisableLogByMatchUrls = new List<string> {"s_tp=3"},
                            ForceEnableLogCookieKey = "ejhDebugLogs",
                            ForceEnableLogCookieValue = "true",
                            PlaceholderValue = "<hidden>"
                        }
                    },
                    "s_tp=3&h_tp=P&tpf=Y&direct=N&brnd=F&names=1&fc_pp=N&{0}&cty=1",
                    MockRequestCookieCollection("ejhDebugLogs", "false"), "test response body", "<hidden>"
                },
                {
                    new ApiSettings
                    {
                        Logging = new LoggingSettings
                        {
                            DisableLogByMatchUrls = new List<string> {"s_tp=4"},
                            ForceEnableLogCookieKey = "ejhDebugLogs",
                            ForceEnableLogCookieValue = "true",
                            PlaceholderValue = "<hidden>"
                        }
                    },
                    "s_tp=3&h_tp=P&tpf=Y&direct=N&brnd=F&names=1&fc_pp=N&{0}&cty=1",
                    MockRequestCookieCollection("ejhDebugLogs", "false"), "test response body", "test response body"
                },
                {
                    new ApiSettings
                    {
                        Logging = new LoggingSettings
                        {
                            DisableLogByMatchUrls = new List<string> {"s_tp=3"},
                            ForceEnableLogCookieKey = "ejhDebugLogs",
                            ForceEnableLogCookieValue = "true",
                            PlaceholderValue = "<hidden>"
                        }
                    },
                    "s_tp=3&h_tp=P&tpf=Y&direct=N&brnd=F&names=1&fc_pp=N&{0}&cty=1",
                    MockRequestCookieCollection("ejhDebugLogs", "true"), "test response body", "test response body"
                },
                {
                    new ApiSettings
                    {
                        Logging = new LoggingSettings
                        {
                            DisableLogByMatchUrls = new List<string> {"s_tp=3"},
                            ForceEnableLogCookieKey = "ejhDebugLogs",
                            ForceEnableLogCookieValue = "true",
                            PlaceholderValue = "<hidden>"
                        }
                    },
                    "s_tp=3&h_tp=P&tpf=Y&direct=N&brnd=F&names=1&fc_pp=N&{0}&cty=1",
                    MockRequestCookieCollection("ejhDebugLogs", "true"), "test response body", "test response body"
                },
                {
                    new ApiSettings
                    {
                        Logging = new LoggingSettings
                        {
                            DisableLogByMatchUrls = null,
                            ForceEnableLogCookieKey = null,
                            ForceEnableLogCookieValue = null,
                            PlaceholderValue = "<hidden>"
                        }
                    },
                    "s_tp=3&h_tp=P&tpf=Y&direct=N&brnd=F&names=1&fc_pp=N&{0}&cty=1",
                    MockRequestCookieCollection("ejhDebugLogs", "true"), "test response body", "test response body"
                },
                {
                    new ApiSettings
                    {
                        Logging = new LoggingSettings
                        {
                            DisableLogByMatchUrls = null,
                            ForceEnableLogCookieKey = "ejhDebugLogs",
                            ForceEnableLogCookieValue = "true",
                            PlaceholderValue = "<hidden>"
                        }
                    },
                    "s_tp=3&h_tp=P&tpf=Y&direct=N&brnd=F&names=1&fc_pp=N&{0}&cty=1",
                    MockRequestCookieCollection("ejhDebugLogs", "true"), "test response body", "test response body"
                }
            };

    }
}
