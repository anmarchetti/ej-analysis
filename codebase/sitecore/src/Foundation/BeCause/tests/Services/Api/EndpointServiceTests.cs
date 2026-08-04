using AutoFixture.Xunit2;
using easyJet.Foundation.BeCause.Services;
using easyJet.Foundation.BeCause.Services.Api;
using easyJet.Foundation.BeCause.Settings;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Xunit;

namespace easyJet.Foundation.BeCause.Tests.Services.Api
{
    public class EndpointServiceTests
    {
        private readonly ISettingsService settingsService;

        public EndpointServiceTests()
        {
            settingsService = Substitute.For<ISettingsService>();
        }

        [Fact]
        public void GetStatusEndpoint_ShouldReturnNull_IfSettingsAreNull()
        {
            // Arrange
            settingsService.GetSettings().ReturnsNull();
            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetStatusEndpoint;

            // Assert
            url.Should().BeNullOrEmpty();
        }

        [Fact]
        public void GetStatusEndpoint_ShouldReturnNull_IfSettingsAreEmpty()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                Endpoint = string.Empty
            });

            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetStatusEndpoint;

            // Assert
            url.Should().BeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void GetStatusEndpoint_ShouldReturnUrl(string endpoint)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                Endpoint = endpoint
            });

            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetStatusEndpoint;

            // Assert
            url.Should().Be($"{endpoint}{Constants.Endpoints.Status}");
        }

        [Fact]
        public void GetCompaniesSearchEndpoint_ShouldReturnNull_IfSettingsAreNull()
        {
            // Arrange
            settingsService.GetSettings().ReturnsNull();
            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetCompaniesSearchEndpoint;

            // Assert
            url.Should().BeNullOrEmpty();
        }

        [Fact]
        public void GetCompaniesSearchEndpoint_ShouldReturnNull_IfSettingsAreEmpty()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                Endpoint = string.Empty
            });

            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetCompaniesSearchEndpoint;

            // Assert
            url.Should().BeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void GetCompaniesSearchEndpoint_ShouldReturnUrl(string endpoint)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                Endpoint = endpoint
            });

            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetCompaniesSearchEndpoint;

            // Assert
            url.Should().Be($"{endpoint}{Constants.Endpoints.CompaniesSearch}");
        }

        [Fact]
        public void GetStandardsSearchEndpoint_ShouldReturnNull_IfSettingsAreNull()
        {
            // Arrange
            settingsService.GetSettings().ReturnsNull();
            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetStandardsSearchEndpoint;

            // Assert
            url.Should().BeNullOrEmpty();
        }

        [Fact]
        public void GetStandardsSearchEndpoint_ShouldReturnNull_IfSettingsAreEmpty()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                Endpoint = string.Empty
            });

            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetStandardsSearchEndpoint;

            // Assert
            url.Should().BeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void GetStandardsSearchEndpoint_ShouldReturnUrl(string endpoint)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                Endpoint = endpoint
            });

            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetStandardsSearchEndpoint;

            // Assert
            url.Should().Be($"{endpoint}{Constants.Endpoints.StandardsSearch}");
        }

        [Fact]
        public void GetCompanyMappingsEndpoint_ShouldReturnNull_IfSettingsAreNull()
        {
            // Arrange
            settingsService.GetSettings().ReturnsNull();
            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetCompanyMappingsEndpoint;

            // Assert
            url.Should().BeNullOrEmpty();
        }

        [Fact]
        public void GetCompanyMappingsEndpoint_ShouldReturnNull_IfSettingsAreEmpty()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                Endpoint = string.Empty
            });

            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetCompanyMappingsEndpoint;

            // Assert
            url.Should().BeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void GetCompanyMappingsEndpoint_ShouldReturnUrl(string endpoint)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                Endpoint = endpoint
            });

            var sut = new EndpointService(settingsService);

            // Act
            var url = sut.GetCompanyMappingsEndpoint;

            // Assert
            url.Should().Be($"{endpoint}{Constants.Endpoints.CompanyMappings}");
        }

        [Fact]
        public void GetGetPollingDelay_ShouldReturnTimespan()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings());

            var sut = new EndpointService(settingsService);

            // Act
            var timeSpan = sut.GetPollingDelay;

            // Assert
            timeSpan.Should().Be(Constants.PollingDelay);
        }
    }
}