using AutoFixture;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.Availability;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class AvailabilityControllerTests
    {
        private readonly IFixture _fixture;

        private readonly AvailabilityController _sut;

        private readonly Mock<IRouteAvailabilityService> _availabilityServiceMock;

        public AvailabilityControllerTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _availabilityServiceMock = new Mock<IRouteAvailabilityService>();

            var options = _fixture.Create<IOptions<SearchSettings>>();

            _sut = new AvailabilityController(_availabilityServiceMock.Object, options);
        }

        [Fact]
        public async Task GetAvailabilityFrom_WithDisabledRouteValidation_ReturnsOKResponseContainingNull()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = true };
            InjectSearchSettingsIntoSUT(settings);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetAvailabilityFrom(default, default, default, default, default, default) as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().BeNull();

            _availabilityServiceMock.Verify(
                mock =>
                    mock.GetDepartureAvailability(
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<DateTime?>(),
                        It.IsAny<DateTime?>(),
                        It.IsAny<int?>(),
                        It.IsAny<string>()
                    ), Times.Never
            );
        }

        [Fact]
        public async Task GetAvailabilityFrom_WithEnabledRouteValidationUsesService_ReturnsOKResponseContainingServiceResponse()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = false };
            InjectSearchSettingsIntoSUT(settings);
            var serviceResponse = Array.Empty<string>();
            _availabilityServiceMock.Setup(
                mock =>
                mock.GetDepartureAvailability(
                    It.IsAny<string>(),
                    It.IsAny<int>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<int?>(),
                    It.IsAny<string>()
                )
            ).ReturnsAsync(serviceResponse);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetAvailabilityFrom(default, default, default, default, default, default) as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().Be(serviceResponse);

            _availabilityServiceMock.Verify(
                mock =>
                mock.GetDepartureAvailability(
                    It.IsAny<string>(),
                    It.IsAny<int>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<int?>(),
                    It.IsAny<string>()
                ), Times.Once
            );
        }

        [Fact]
        public async Task GetAvailabilityTo_WithDisabledRouteValidation_ReturnsOKResponseContainingNull()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = true };
            InjectSearchSettingsIntoSUT(settings);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetAvailabilityTo(default, default, default, default, default) as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().BeNull();

            _availabilityServiceMock.Verify(
                mock =>
                mock.GetDestinationAvailability(
                    It.IsAny<string>(),
                    It.IsAny<int>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<int?>(),
                    It.IsAny<string>()
                ), Times.Never
            );
        }

        [Fact]
        public async Task GetAvailabilityTo_WithEnabledRouteValidation_ReturnsOKResponseWithEmptyArrayForNoResults()
        {
            var settings = new SearchSettings() { DisableRouteValidation = false };
            InjectSearchSettingsIntoSUT(settings);
            var serviceResponse = new DestinationsSearchResponse();
            _availabilityServiceMock.Setup(
                mock =>
                    mock.GetDestinationAvailability(
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<DateTime?>(),
                        It.IsAny<DateTime?>(),
                        It.IsAny<int?>(),
                        It.IsAny<string>()
                    )
            ).ReturnsAsync(serviceResponse);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetAvailabilityTo(default, default, default, default, default) as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().Be(Array.Empty<string>());

            _availabilityServiceMock.Verify(
                mock =>
                    mock.GetDestinationAvailability(
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<DateTime?>(),
                        It.IsAny<DateTime?>(),
                        It.IsAny<int?>(),
                        It.IsAny<string>()
                    ), Times.Once
            );
        }

        [Fact]
        public async Task GetAvailabilityTo_WithEnabledRouteValidation_ReturnsOKResponseWithDestinationAndRelatedRegionCodes()
        {
            var settings = new SearchSettings() { DisableRouteValidation = false };
            InjectSearchSettingsIntoSUT(settings);
#pragma warning disable CA1861 // Avoid constant arrays as arguments
            var serviceResponse = new DestinationsSearchResponse()
            {
                Destinations = new List<DestinationItem>()
                {
                    new DestinationItem(){ Code = "A", Type = DestinationItemType.VirtualCountry, RelatedRegions = new string[]{ "B", "C" }},
                    new DestinationItem(){ Code = "a", Type = DestinationItemType.Country, RelatedRegions = new string[]{ "b", "c" }}
                }
            };
#pragma warning restore CA1861 // Avoid constant arrays as arguments
            _availabilityServiceMock.Setup(
                mock =>
                    mock.GetDestinationAvailability(
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<DateTime?>(),
                        It.IsAny<DateTime?>(),
                        It.IsAny<int?>(),
                        It.IsAny<string>()
                    )
            ).ReturnsAsync(serviceResponse);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetAvailabilityTo(default, default, default, default, default) as ObjectResult;
            var castValue = result?.Value as string[];

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            castValue.Should().NotBeNull();
#pragma warning disable CA1861 // Avoid constant arrays as arguments
            castValue.Should().ContainInOrder(new string[] { "A", "B", "C" });
#pragma warning restore CA1861 // Avoid constant arrays as arguments
            castValue.Should().Contain("a");
#pragma warning disable CA1861 // Avoid constant arrays as arguments
            castValue.Should().NotContain(new string[] { "b", "c" });
#pragma warning restore CA1861 // Avoid constant arrays as arguments

            _availabilityServiceMock.Verify(
                mock =>
                    mock.GetDestinationAvailability(
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<DateTime?>(),
                        It.IsAny<DateTime?>(),
                        It.IsAny<int?>(),
                        It.IsAny<string>()
                    ), Times.Once
            );
        }

        [Fact]
        public async Task GetAvailabilityDates_WithDisabledRouteValidation_ReturnsOKResponseContainingNull()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = true };
            InjectSearchSettingsIntoSUT(settings);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetAvailabilityDates(default, default, default, default, default, default) as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().BeNull();

            _availabilityServiceMock.Verify(
                mock =>
                mock.GetAvailabilityDates(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<DateTime?>(),
                     It.IsAny<DateTime?>(),
                    It.IsAny<string>()
                ), Times.Never
            );
        }

        [Fact]
        public async Task GetAvailabilityDates_WithEnabledRouteValidation_ReturnsOKResponseContainingServiceResponse()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = false };
            InjectSearchSettingsIntoSUT(settings);
            var serviceResponse = new DatesAvailability();
            _availabilityServiceMock.Setup(
                mock =>
                mock.GetAvailabilityDates(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<DateTime?>(),
                     It.IsAny<DateTime?>(),
                    It.IsAny<string>()
                )
            ).ReturnsAsync(serviceResponse);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetAvailabilityDates(default, default, default, default, default, default) as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().Be(serviceResponse);

            _availabilityServiceMock.Verify(
                mock =>
                mock.GetAvailabilityDates(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<DateTime?>(),
                     It.IsAny<DateTime?>(),
                    It.IsAny<string>()
                ), Times.Once
            );
        }

        [Fact]
        public async Task GetAvailabilityMonths_WithDisabledRouteValidation_ReturnsOKResponseContainingNull()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = true };
            InjectSearchSettingsIntoSUT(settings);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetAvailabilityMonths(default, default, default) as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().BeNull();

            _availabilityServiceMock.Verify(
                mock =>
                mock.GetAvailabilityMonths(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<int>()
                ), Times.Never
            );
        }

        [Fact]
        public async Task GetAvailabilityMonths_WithEnabledRouteValidation_ReturnsOKResponseContainingServiceResponse()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = false };
            InjectSearchSettingsIntoSUT(settings);
            var serviceResponse = new MonthsAvailabilityResponse();
            _availabilityServiceMock.Setup(
                mock =>
                mock.GetAvailabilityMonths(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<int>()
                )
            ).ReturnsAsync(serviceResponse);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetAvailabilityMonths(default, default, default) as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().Be(serviceResponse);

            _availabilityServiceMock.Verify(
                mock =>
                mock.GetAvailabilityMonths(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<int>()
                ), Times.Once
            );
        }

        [Fact]
        public async Task GetLastAvailableDate_WithDisabledRouteValidation_ReturnsOKResponseContainingNull()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = true };
            InjectSearchSettingsIntoSUT(settings);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetLastAvailableDate() as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().BeNull();

            _availabilityServiceMock.Verify(
                mock =>
                mock.GetLastAvailableDate(), Times.Never
            );
        }

        [Fact]
        public async Task GetLastAvailableDate_WithEnabledRouteValidation_ReturnsOKResponseContainingServiceResponse()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = false };
            InjectSearchSettingsIntoSUT(settings);
            var serviceResponse = new AvailabilityDate();
            _availabilityServiceMock.Setup(
                mock =>
                mock.GetLastAvailableDate()
            ).ReturnsAsync(serviceResponse);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.GetLastAvailableDate() as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().Be(serviceResponse);

            _availabilityServiceMock.Verify(
                mock =>
                    mock.GetLastAvailableDate(), Times.Once
            );
        }

        [Fact]
        public async Task AvailabilityExists_WithDisabledRouteValidation_ReturnsOKResponseContainingNull()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = true };
            InjectSearchSettingsIntoSUT(settings);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.AvailabilityExists(default) as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().BeEquivalentTo(new Dictionary<string, bool>());

            _availabilityServiceMock.Verify(
                mock =>
                mock.DestinationAvailabilityExists(
                    It.IsAny<string>()
                ), Times.Never
            );
        }

        [Fact]
        public async Task AvailabilityExists_WithEnabledRouteValidation_ReturnsOKResponseContainingServiceResponse()
        {
            // Arrange
            var settings = new SearchSettings() { DisableRouteValidation = false };
            InjectSearchSettingsIntoSUT(settings);
            var serviceResponse = new Dictionary<string, bool>() { { "Test", true } };
            _availabilityServiceMock.Setup(
                mock =>
                mock.DestinationAvailabilityExists(It.IsAny<string>())
            ).ReturnsAsync(serviceResponse);

            // Act
            // casting the result as IActionResult is rather empty
            var result = await _sut.AvailabilityExists(default) as ObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            result.Value.Should().Be(serviceResponse);

            _availabilityServiceMock.Verify(
                mock =>
                mock.DestinationAvailabilityExists(
                    It.IsAny<string>()
                ), Times.Once
            );
        }

        private void InjectSearchSettingsIntoSUT(SearchSettings settings)
        {
            _sut.SetPrivateField("_searchSettings", settings);
        }
    }
}
