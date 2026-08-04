using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Services;
using easyJet.Holidays.Api.Domain.Services.Analytics;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Analytics;

public class AnalyticsServiceTests
{
    private readonly Mock<ILogger<AnalyticsService>> _logger;
    private readonly Mock<ICookiesService> _cookiesService;
    private readonly Mock<IAuthenticationService> _authService;
    private readonly Mock<IDAIntegrationService> _daIntegrationService;
    private readonly EnvironmentBehaviourSettings _environmentBehaviourSettings;
    private readonly AnalyticsCookiesSettings _analyticsCookiesSettings;

    private readonly AnalyticsService _sut;

    public AnalyticsServiceTests()
    {
        _logger = new();
        _cookiesService = new();
        _authService = new();
        _daIntegrationService = new();
        _environmentBehaviourSettings = new()
        {
            AllowAnalyticsCookies = true
        };
        _analyticsCookiesSettings = new()
        {
            SessionCookieName = "session",
            SessionCookieExpirationMinutes = 100,
            UserCookieName = "user",
            UserCookieExpirationMinutes = 200,
            CookieDomain = "domain"
        };

        var cookieSettings = new CookiesSettings() { Analytics = _analyticsCookiesSettings };

        _sut = new AnalyticsService(
            _logger.Object,
            _cookiesService.Object,
            _authService.Object,
            _daIntegrationService.Object,
            Options.Create(_environmentBehaviourSettings),
            Options.Create(cookieSettings));
    }

    [Fact]
    public void AddAnalyticsData_WhenAnalyticsAreEnabled_AddsSessionAndIdCookiesToContext()
    {
        // Arrange
        var context = new DefaultHttpContext();

        const string sessionCookieValue = "sessionValue";
        _cookiesService.Setup(mock =>
            mock.GetCookie(
                It.IsAny<IRequestCookieCollection>(),
                It.Is<string>(param => string.Equals(param, _analyticsCookiesSettings.SessionCookieName))
        )).Returns(sessionCookieValue);

        const string userName = "someUser";
        const string serialized = "whateverHappensToTheUserName";

        _daIntegrationService.Setup(mock =>
                mock.Serialize(It.Is<string>(param => string.Equals(param, userName))
        )).Returns(serialized);

        var authData = new CustomerAuthModel
        {
            Credentials = new() { Username = userName }
        };
        _cookiesService.Setup(mock =>
            mock.GetCookie(It.IsAny<IRequestCookieCollection>(),
                It.Is<string>(param => string.Equals(param, _analyticsCookiesSettings.UserCookieName))
        )).Returns((null as string)!);

        _authService.Setup(mock => mock.AuthData()).Returns(authData);

        // Act
        _sut.AddAnalyticsData(context);

        // Assert
        _cookiesService.Verify(mock =>
            mock.CreateCookie(
                context,
                _analyticsCookiesSettings.SessionCookieName,
                It.IsAny<string>(),
                _analyticsCookiesSettings.CookieDomain,
                It.IsAny<DateTime?>(),
                true
            ), Times.Once
        );

        _cookiesService.Verify(mock =>
            mock.CreateCookie(
                context,
                _analyticsCookiesSettings.UserCookieName,
                serialized,
                _analyticsCookiesSettings.CookieDomain,
                It.IsAny<DateTime?>(),
                true
            ), Times.Once
        );

        context.Items.Should().NotBeNullOrEmpty();

        context.Items.Should().ContainKey(_analyticsCookiesSettings.SessionCookieName).And
            .Subject[_analyticsCookiesSettings.SessionCookieName].Should().Be(sessionCookieValue);

        context.Items.Should().ContainKey(_analyticsCookiesSettings.UserCookieName).And
            .Subject[_analyticsCookiesSettings.UserCookieName].Should().Be(serialized);

        _logger.VerifyNoOtherCalls();
    }

    [Fact]
    public void AddAnalyticsData_WhenAnalyticsAreEnabled_ButUserIsNotLoggedIn_AddsOnlySessionCookieToContext()
    {
        // Arrange
        var context = new DefaultHttpContext();

        const string sessionCookieValue = "sessionValue";
        _cookiesService.Setup(mock =>
            mock.GetCookie(
                It.IsAny<IRequestCookieCollection>(),
                It.Is<string>(param => string.Equals(param, _analyticsCookiesSettings.SessionCookieName))
            )).Returns(sessionCookieValue);

        _cookiesService.Setup(mock =>
            mock.GetCookie(It.IsAny<IRequestCookieCollection>(),
                It.Is<string>(param => string.Equals(param, _analyticsCookiesSettings.UserCookieName))
            )).Returns((null as string)!);

        _authService.Setup(mock => mock.AuthData()).Returns((null as CustomerAuthModel)!);

        // Act
        _sut.AddAnalyticsData(context);

        // Assert
        _cookiesService.Verify(mock =>
                mock.CreateCookie(
                    context,
                    _analyticsCookiesSettings.SessionCookieName,
                    It.IsAny<string>(),
                    _analyticsCookiesSettings.CookieDomain,
                    It.IsAny<DateTime?>(),
                    true
                ), Times.Once
        );

        _cookiesService.Verify(
            mock =>
                mock.DeleteCookie(
                    context,
                    _analyticsCookiesSettings.UserCookieName,
                    _analyticsCookiesSettings.CookieDomain,
                    true)
        );

        _daIntegrationService.Verify(mock => mock.Serialize(It.IsAny<string>()), Times.Never);

        context.Items.Should().NotBeNullOrEmpty();

        context.Items.Should().ContainKey(_analyticsCookiesSettings.SessionCookieName).And
            .Subject[_analyticsCookiesSettings.SessionCookieName].Should().Be(sessionCookieValue);

        context.Items.Should().ContainKey(_analyticsCookiesSettings.UserCookieName).And
            .Subject[_analyticsCookiesSettings.UserCookieName].Should().Be(null);

        _logger.VerifyNoOtherCalls();
    }

    [Fact]
    public void AddAnalyticsData_WhenAnalyticsAreDisabled_AttemptsCookieDeletionFromContext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        _environmentBehaviourSettings.AllowAnalyticsCookies = false;

        // Act
        _sut.AddAnalyticsData(context);

        // Assert
        _cookiesService.Verify(
            mock =>
                mock.DeleteCookie(
                    context,
                    _analyticsCookiesSettings.SessionCookieName,
                    _analyticsCookiesSettings.CookieDomain,
                    true)
        );

        _cookiesService.Verify(
            mock =>
                mock.DeleteCookie(
                    context,
                    _analyticsCookiesSettings.UserCookieName,
                    _analyticsCookiesSettings.CookieDomain,
                    true)
        );

        _cookiesService.VerifyNoOtherCalls();
        _authService.VerifyNoOtherCalls();
        _daIntegrationService.VerifyNoOtherCalls();
    }

    [Fact]
    public void GetAnalyticsData_WhenProvidedContextIsNull_ReturnsNull()
    {
        // Arrange
        HttpContext ctx = null;

        // Act
        var result = _sut.GetAnalyticsData(ctx);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetAnalyticsData_RetrievesDataFromContext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        const string sessionCookieValue = "session";
        const string userCookieValue = "user";

        context.Items[_analyticsCookiesSettings.SessionCookieName] = sessionCookieValue;
        context.Items[_analyticsCookiesSettings.UserCookieName] = userCookieValue;

        // Act
        var result = _sut.GetAnalyticsData(context);

        // Assert
        result.Should().NotBeNull();
        result.SessionId.Should().Be(sessionCookieValue);
        result.UserId.Should().Be(userCookieValue);
    }
}