using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.Tests.Domain.Extensions;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Domain.Tests.Services
{
    /// <summary>
    /// Test implementation for abstract class
    /// </summary>
    class TestEndpointsProvider : BaseEndpointsProvider
    {
        public const int ApiServiceType = 0;

        public TestEndpointsProvider(IOptions<EnvironmentBehaviourSettings> envBehaviorSettings, ICookiesService cookiesService, ILogger<BaseEndpointsProvider> logger)
            : base(envBehaviorSettings, cookiesService, logger)
        {
            UriContainer[ApiServiceType] = new Domain.Models.EndpointUri("https://domain", "/api/service");
        }

        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            // Test implementation to get "mock" cookie value
            var cookieName = "mock";
            if (!cookies.TryGetValue(cookieName, out var cookieBody))
            {
                return null;
            }

            return cookieBody;
        }

        public new Uri GetEndpoint(int type, IRequestCookieCollection cookies)
        {
            return base.GetEndpoint(type, cookies);
        }
    }

    public class BaseEndpointsProviderTests
    {
        [Fact]
        public void GetEndpoint_EndpointNotConfigured_ThrowException()
        {
            // Arrange
            var envOptions = Options.Create(new EnvironmentBehaviourSettings
            {
                AllowMockCookies = true
            });

            var loggerMock = new Mock<ILogger<BaseEndpointsProvider>>();
            var provider = new TestEndpointsProvider(envOptions, null, loggerMock.Object);

            // Act
            Func<Uri> action = () => provider.GetEndpoint(1, null);

            // Assert
            action.Should().Throw<ArgumentOutOfRangeException>();
        }

        [Fact]
        public void GetEndpoint_MocksNotAllowed_UriShouldBeUsed()
        {
            // Arrange
            var envOptions = Options.Create(new EnvironmentBehaviourSettings
            {
                AllowMockCookies = false
            });

            var provider = new TestEndpointsProvider(envOptions, null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Act
            var actual = provider.GetEndpoint(TestEndpointsProvider.ApiServiceType, null);

            // Assert
            actual.Should().Be(new Uri("https://domain/api/service"));
        }

        [Fact]
        public void GetEndpoint_MocksAllowedCookieContainerNull_UriShouldBeUsed()
        {
            // Arrange
            var envOptions = Options.Create(new EnvironmentBehaviourSettings
            {
                AllowMockCookies = true
            });

            var provider = new TestEndpointsProvider(envOptions, null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Act
            var actual = provider.GetEndpoint(TestEndpointsProvider.ApiServiceType, null);

            // Assert
            actual.Should().Be(new Uri("https://domain/api/service"));
        }

        [Fact]
        public void GetEndpoint_MocksAllowedAndNoMockCookie_UriShouldBeUsed()
        {
            // Arrange
            var envOptions = Options.Create(new EnvironmentBehaviourSettings
            {
                AllowMockCookies = true
            });

            var provider = new TestEndpointsProvider(envOptions, null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Act
            var actual = provider.GetEndpoint(TestEndpointsProvider.ApiServiceType, MockRequestCookieCollectionExtension.MockRequestCookieCollectionString("someCookieButNotMock=http://mockdomain/api/service;"));

            // Assert
            actual.Should().Be(new Uri("https://domain/api/service"));
        }

        [Fact]
        public void GetEndpoint_MocksAllowedCookieExists_MockShouldBeUsed()
        {
            // Arrange
            var envOptions = Options.Create(new EnvironmentBehaviourSettings
            {
                AllowMockCookies = true
            });

            var provider = new TestEndpointsProvider(envOptions, null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Act
            var actual = provider.GetEndpoint(TestEndpointsProvider.ApiServiceType, MockRequestCookieCollectionExtension.MockRequestCookieCollectionString("mock=https://mockdomain.local/path/name/ignored"));

            // Assert
            actual.Should().Be(new Uri("https://mockdomain.local/api/service"));
        }
    }
}
