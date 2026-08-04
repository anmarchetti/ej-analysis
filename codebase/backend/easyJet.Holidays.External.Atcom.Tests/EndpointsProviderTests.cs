using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.Tests.Domain.Extensions;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests;

public class EndpointsProviderTests
{
    private readonly Mock<ICookiesService> _cookiesService;
    private readonly AtcomSettings _atcomSettings;
    private readonly EnvironmentBehaviourSettings _envBehaviorSettings;

    private readonly EndpointsProvider _sut;

    public EndpointsProviderTests()
    {
        _cookiesService = new();
        Mock<ILogger<EndpointsProvider>> logger = new();
        _atcomSettings = new()
        {
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
            Booking = new()
            {
                Host = "http://booking-domain",
                BaseUrl = "/api/booking",
            }
        };
        _envBehaviorSettings = new();

        _sut = new(
            Options.Create(_atcomSettings),
            Options.Create(_envBehaviorSettings),
            _cookiesService.Object,
            logger.Object
        );
    }

    [Fact]
    public void Constructor_NullSettings_ThrowException()
    {
        // Arrange
        var atcomSettings = Options.Create<AtcomSettings>(null!);

        // Act
        var action = () => new EndpointsProvider(atcomSettings, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<EndpointsProvider>>().Object);

        // Assert
        action.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(AtcomEndpoint.Booking, "http://booking-domain/api/booking")]
    [InlineData(AtcomEndpoint.SearchUk, "http://search-domain/api/searchuk")]
    [InlineData(AtcomEndpoint.SearchCh, "http://search-domain/api/searchch")]
    [InlineData(AtcomEndpoint.SearchDe, "http://search-domain/api/searchde")]
    [InlineData(AtcomEndpoint.SearchFr, "http://search-domain/api/searchfr")]
    public void Constructor_ShouldInitEndpoints(AtcomEndpoint input, string expected)
    {
        // Arrange

        // Act
        var result = _sut.GetEndpoint(input, null);

        // Assert
        result.Should().Be(expected);
    }

    [Theory]
    [InlineData("UK", "http://search-domain/api/searchuk")]
    [InlineData("LU", "http://search-domain/api/searchuk")]
    [InlineData("ch", "http://search-domain/api/searchuk")] // market codes are uppercase, so this would be fallback, rather than CH
    [InlineData("CH", "http://search-domain/api/searchch")]
    [InlineData("DE", "http://search-domain/api/searchde")]
    [InlineData("FR", "http://search-domain/api/searchfr")]
    public void GetSearchEndpointByMarket_CorrectlyMapsEndpointToMarket(string marketCode, string expected)
    {
        // Arrange

        // Act
        var result = _sut.GetSearchEndpointByMarket(marketCode, null);

        // Assert
        result.Should().Be(expected);
    }

    [Fact]
    public void GetMockedDomain_CallsAtcomMockCookie()
    {
        // Arrange
        _cookiesService.Setup(x => x.AtcomMockCookie(It.IsAny<IRequestCookieCollection>())).Returns("test");

        var cookiesContainer = MockRequestCookieCollectionExtension.MockRequestCookieCollectionString(string.Empty);

        var localSut = new ExposedMockedDomainProvider(
            Options.Create(_atcomSettings),
            Options.Create(_envBehaviorSettings),
            _cookiesService.Object,
            new Mock<ILogger<ExposedMockedDomainProvider>>().Object
        );

        // Act
        localSut.GetMockedDomain(cookiesContainer);

        // Assert
        _cookiesService.Verify(x => x.AtcomMockCookie(cookiesContainer), Times.Once);
    }
}

internal class ExposedMockedDomainProvider : EndpointsProvider
{
    public ExposedMockedDomainProvider(IOptions<AtcomSettings> atcomOptions, IOptions<EnvironmentBehaviourSettings> envBehaviorSettings, ICookiesService cookiesService, ILogger<ExposedMockedDomainProvider> logger)
        : base(atcomOptions, envBehaviorSettings, cookiesService, logger)
    {
    }

    public new string GetMockedDomain(IRequestCookieCollection cookies)
    {
        return base.GetMockedDomain(cookies);
    }
}