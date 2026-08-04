using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.Tests.Domain.Extensions;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Cms.Tests.Services
{
    class ExposedMockedDomainProvider : EndpointsProvider
    {
        public ExposedMockedDomainProvider(IOptions<CmsSettings> settings, IOptions<EnvironmentBehaviourSettings> envBehaviorSettings, ICookiesService cookiesService, ILogger<BaseEndpointsProvider> logger)
            : base(settings, envBehaviorSettings, cookiesService, logger)
        {
        }

        public new string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return base.GetMockedDomain(cookies);
        }
    }

    public class EndpointsProviderTests
    {
        [Fact]
        public void Constructor_NullSettings_ThrowException()
        {
            // Arrange
            var cmsSettings = Options.Create<CmsSettings>(null);

            // Act
            Action sut = () => new EndpointsProvider(cmsSettings, Options.Create(new EnvironmentBehaviourSettings()), null, null);

            // Assert
            sut.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Constructor_ShouldInitEndpoints()
        {
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings
                {
                    GetHotels = "api/hotels",
                    DestinationsSearch = "api/destinations",
                    Airports = "api/airports"
                },
            });
            var loggerMock = new Mock<ILogger<BaseEndpointsProvider>>();

            // Act
            var sut = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, loggerMock.Object);

            // Assert
            sut.GetEndpoint(CmsEndpoint.SearchHotels, null).Should().Be("http://cms-domain/api/hotels");
            sut.GetEndpoint(CmsEndpoint.SearchDestinations, null).Should().Be("http://cms-domain/api/destinations");
            sut.GetEndpoint(CmsEndpoint.Airports, null).Should().Be("http://cms-domain/api/airports");
        }

        [Fact]
        public void GetMockedDomain_CallsSitecoreMockCookie()
        {
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings
                {
                    GetHotels = "api/hotels"
                },
            });

            var cookiesServiceMoq = new Mock<ICookiesService>();
            cookiesServiceMoq.Setup(x => x.SitecoreMockCookie(It.IsAny<IRequestCookieCollection>())).Returns("test");

            var cookiesContainer = MockRequestCookieCollectionExtension.MockRequestCookieCollectionString(string.Empty);
            var sut = new ExposedMockedDomainProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), cookiesServiceMoq.Object, null);

            // Act
            sut.GetMockedDomain(cookiesContainer);

            // Assert
            cookiesServiceMoq.Verify(x => x.SitecoreMockCookie(cookiesContainer), Times.Once);
        }

        [Fact]
        public void Constructor_ShouldInitFilterPillsConfigEndpoint()
        {
            // Arrange
            var settings = Options.Create(new CmsSettings()
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings
                {
                    GetFilterPillsConfig = "api/filters/pills"
                },
            });
            var loggerMock = new Mock<ILogger<BaseEndpointsProvider>>();

            // Act
            var sut = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, loggerMock.Object);

            // Assert
            sut.GetEndpoint(CmsEndpoint.GetFilterPillsConfig, null).Should().Be("http://cms-domain/api/filters/pills");
        }
    }
}
