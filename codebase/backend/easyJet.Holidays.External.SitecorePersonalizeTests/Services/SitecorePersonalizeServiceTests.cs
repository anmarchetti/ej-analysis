#nullable enable

using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.SitecorePersonalize.Models;
using easyJet.Holidays.External.SitecorePersonalize.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.SitecorePersonalizeTests.Services;

public class SitecorePersonalizeServiceTests
{
    private sealed class CacheCapture
    {
        public string[] Keys { get; set; } = Array.Empty<string>();
    }

    [Fact]
    public async Task GetExperimentFilterOrder_UserCookieMissing_ReturnsDefaultValue_AndDoesNotCallApi()
    {
        var settings = CreateSettings();

        var apiServiceMock = new Mock<IApiService>(MockBehavior.Strict);

        var sut = CreateSut(
            settings,
            apiServiceMock,
            CreateHttpContext(cookieHeader: string.Empty),
            out _,
            out var cacheServiceMock);

        var result = await sut.GetExperimentFilterOrder("sort-order", Array.Empty<string>(), "desktop");

        Assert.Equal(settings.DefaultAttributeResult, result);

        apiServiceMock.Verify(
            x => x.GetResponseContentAsync<SitecorePersonalizeRequest, SitecorePersonalizeFilterOrderingResponse>(
                It.IsAny<SitecorePersonalizeRequest>()),
            Times.Never);
    }

    [Fact]
    public async Task GetExperimentFilterOrder_ValidResponse_ReturnsFilterOrder_AndBuildsExpectedRequest()
    {
        var settings = CreateSettings();

        var apiServiceMock = new Mock<IApiService>(MockBehavior.Strict);
        SitecorePersonalizeRequest? capturedRequest = null;

        apiServiceMock
            .Setup(x => x.GetResponseContentAsync<SitecorePersonalizeRequest, SitecorePersonalizeFilterOrderingResponse>(
                It.IsAny<SitecorePersonalizeRequest>()))
            .Callback<SitecorePersonalizeRequest>(req => capturedRequest = req)
            .ReturnsAsync(new SitecorePersonalizeFilterOrderingResponse
            {
                Payload = new JsonApiPayload<SitecorePersonalizeFilterOrderingResponseBody>
                {
                    Body = new SitecorePersonalizeFilterOrderingResponseBody { FilterOrder = "experiment-a" }
                }
            });

        var destinationCodes = new List<string> { "PMI", "ALC" };

        var cookieName = $"{settings.CookieFormat}{settings.ClientKey}";
        var sut = CreateSut(
            settings,
            apiServiceMock,
            CreateHttpContext($"{cookieName}=bid-123"),
            out _,
            out var cacheServiceMock);

        var result = await sut.GetExperimentFilterOrder("sort-order", destinationCodes, null!);

        Assert.Equal("experiment-a", result);

        Assert.NotNull(capturedRequest);
        Assert.Equal(HttpMethod.Post, capturedRequest!.Method);
        Assert.Equal(new Uri("https://sitecore.example/api/callflows"), capturedRequest.Endpoint);

        Assert.NotNull(capturedRequest.Payload);
        Assert.NotNull(capturedRequest.Payload.Body);

        Assert.Equal("sort-order", capturedRequest.Payload.Body.FriendlyId);
        Assert.Equal("bid-123", capturedRequest.Payload.Body.BrowserId);
        Assert.Equal(settings.ClientKey, capturedRequest.Payload.Body.ClientKey);
        Assert.Equal(settings.DefaultChannel, capturedRequest.Payload.Body.Channel);
        Assert.Equal(settings.DefaultPointOfSale, capturedRequest.Payload.Body.PointOfSale);
        Assert.Equal("en", capturedRequest.Payload.Body.Language);
        Assert.Equal("GBP", capturedRequest.Payload.Body.CurrencyCode);

        Assert.NotNull(capturedRequest.Payload.Body.CustomParameters);
        Assert.True(capturedRequest.Payload.Body.CustomParameters!.ContainsKey("destinationCodes"));
        Assert.Same(destinationCodes, capturedRequest.Payload.Body.CustomParameters["destinationCodes"]);
        Assert.True(capturedRequest.Payload.Body.CustomParameters!.ContainsKey("deviceType"));
        Assert.Equal("WEB", capturedRequest.Payload.Body.CustomParameters["deviceType"]);

        cacheServiceMock.VerifyAll();
        apiServiceMock.VerifyAll();
    }

    [Fact]
    public async Task GetExperimentFilterOrder_ResponseHasNullFilterOrder_ReturnsDefaultValue()
    {
        var settings = CreateSettings();

        var apiServiceMock = new Mock<IApiService>(MockBehavior.Strict);
        apiServiceMock
            .Setup(x => x.GetResponseContentAsync<SitecorePersonalizeRequest, SitecorePersonalizeFilterOrderingResponse>(
                It.IsAny<SitecorePersonalizeRequest>()))
            .ReturnsAsync(new SitecorePersonalizeFilterOrderingResponse
            {
                Payload = new JsonApiPayload<SitecorePersonalizeFilterOrderingResponseBody>
                {
                    Body = new SitecorePersonalizeFilterOrderingResponseBody { FilterOrder = null }
                }
            });

        var cookieName = $"{settings.CookieFormat}{settings.ClientKey}";
        var sut = CreateSut(
            settings,
            apiServiceMock,
            CreateHttpContext($"{cookieName}=bid-123"),
            out _,
            out var cacheServiceMock);

        var result = await sut.GetExperimentFilterOrder("sort-order", Array.Empty<string>(), "desktop");

        Assert.Equal(settings.DefaultAttributeResult, result);

        cacheServiceMock.VerifyAll();
        apiServiceMock.VerifyAll();
    }

    [Fact]
    public async Task GetExperimentFilterOrder_ApiThrows_ReturnsDefaultValue_AndLogsError()
    {
        var settings = CreateSettings();

        var apiServiceMock = new Mock<IApiService>(MockBehavior.Strict);
        apiServiceMock
            .Setup(x => x.GetResponseContentAsync<SitecorePersonalizeRequest, SitecorePersonalizeFilterOrderingResponse>(
                It.IsAny<SitecorePersonalizeRequest>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        var cookieName = $"{settings.CookieFormat}{settings.ClientKey}";
        var sut = CreateSut(
            settings,
            apiServiceMock,
            CreateHttpContext($"{cookieName}=bid-123"),
            out var loggerMock,
            out var cacheServiceMock);

        var result = await sut.GetExperimentFilterOrder("sort-order", Array.Empty<string>(), "desktop");

        Assert.Equal(settings.DefaultAttributeResult, result);

        loggerMock.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);

        cacheServiceMock.VerifyAll();
        apiServiceMock.VerifyAll();
    }

    [Fact]
    public async Task GetExperimentFilterOrder_UsesCache_WithStableOrderedDestinationKeys()
    {
        var settings = CreateSettings();

        var apiServiceMock = new Mock<IApiService>(MockBehavior.Strict);
        apiServiceMock
            .Setup(x => x.GetResponseContentAsync<SitecorePersonalizeRequest, SitecorePersonalizeFilterOrderingResponse>(
                It.IsAny<SitecorePersonalizeRequest>()))
            .ReturnsAsync(new SitecorePersonalizeFilterOrderingResponse
            {
                Payload = new JsonApiPayload<SitecorePersonalizeFilterOrderingResponseBody>
                {
                    Body = new SitecorePersonalizeFilterOrderingResponseBody { FilterOrder = "experiment-a" }
                }
            });

        var cookieName = $"{settings.CookieFormat}{settings.ClientKey}";
        var cacheCapture = new CacheCapture();
        var sut = CreateSut(
            settings,
            apiServiceMock,
            CreateHttpContext($"{cookieName}=bid-123"),
            out _,
            out var cacheServiceMock,
            cacheCapture);

        var destinationCodes = new[] { "ZRH", "ALC", "PMI" };

        _ = await sut.GetExperimentFilterOrder("sort-order", destinationCodes, string.Empty);

        Assert.NotEmpty(cacheCapture.Keys);
        Assert.Equal("SitecorePersonalizeFilterCache", cacheCapture.Keys[0]);
        Assert.Equal("WEB", cacheCapture.Keys[1]);
        Assert.Equal(new[] { "ALC", "PMI", "ZRH" }, cacheCapture.Keys.Skip(2).ToArray());

        cacheServiceMock.VerifyAll();
        apiServiceMock.VerifyAll();
    }

    private static SitecorePersonalizeSettings CreateSettings() =>
        new()
        {
            // Service builds cookie name as $"{CookieFormat}{ClientKey}"
            CookieFormat = "bid-",
            UserIdCookie = "bid",
            ClientKey = "client-key",
            DefaultChannel = "WEB",
            DefaultPointOfSale = "UK",
            DefaultAttributeResult = "default",
            Host = "https://sitecore.example",
            TimeoutMilliSeconds = 5000,
            Api = new SitecorePersonalizeApiSettings
            {
                CallFlows = "api/callflows"
            }
        };

    private static IHttpContextAccessor CreateHttpContext(string cookieHeader)
    {
        var context = new DefaultHttpContext();
        if (!string.IsNullOrWhiteSpace(cookieHeader))
        {
            context.Request.Headers.Cookie = cookieHeader;
        }

        return new HttpContextAccessor { HttpContext = context };
    }

    private static SitecorePersonalizeService CreateSut(
        SitecorePersonalizeSettings settings,
        Mock<IApiService> apiServiceMock,
        IHttpContextAccessor httpContextAccessor,
        out Mock<ILogger<SitecorePersonalizeService>> loggerMock,
        out Mock<ICacheService> cacheServiceMock,
        CacheCapture? cacheCapture = null)
    {
        var marketServiceMock = new Mock<IMarketService>(MockBehavior.Strict);
        marketServiceMock
            .Setup(x => x.GetCurrentMarket())
            .Returns(new MarketSettings
            {
                MasterLanguage = "en",
                Currency = new Currency { Code = "GBP" }
            });

        var endpointsProvider = new EndpointsProvider(
            Options.Create(settings),
            Options.Create(new EnvironmentBehaviourSettings()),
            null,
            new Mock<ILogger<EndpointsProvider>>().Object);

        loggerMock = new Mock<ILogger<SitecorePersonalizeService>>();

        cacheServiceMock = new Mock<ICacheService>(MockBehavior.Strict);
        cacheServiceMock
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
            It.IsAny<ICollection<string>>(),
            It.IsAny<Func<Task<string>>>(),
            It.IsAny<bool>()))
            .Returns<string, ICollection<string>, Func<Task<string>>, bool>(async (_, keys, factory, __) =>
            {
                if (cacheCapture != null)
                {
                    cacheCapture.Keys = keys.ToArray();
                }
                return await factory();
            });

        var cacheSettings = new CacheSettings
        {
            Buckets = new Buckets
            {
                SearchCache = "search-cache"
            }
        };

        return new SitecorePersonalizeService(
            apiServiceMock.Object,
            endpointsProvider,
            httpContextAccessor,
            Options.Create(settings),
            marketServiceMock.Object,
            cacheServiceMock.Object,
            Options.Create(cacheSettings),
            loggerMock.Object);
    }

    private static SitecorePersonalizeService CreateSut(
        SitecorePersonalizeSettings settings,
        Mock<IApiService> apiServiceMock,
        IHttpContextAccessor httpContextAccessor,
        out Mock<ILogger<SitecorePersonalizeService>> loggerMock,
        out Mock<ICacheService> cacheServiceMock)
        => CreateSut(settings, apiServiceMock, httpContextAccessor, out loggerMock, out cacheServiceMock, null);
}
