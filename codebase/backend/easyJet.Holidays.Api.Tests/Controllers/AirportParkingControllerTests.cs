using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.AirportParking;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Tests.Controllers
{
    public class AirportParkingControllerTests
    {
        private readonly AirportParkingController _sut;

        private readonly Mock<IReferenceDataService> _referenceDataService = new();
        private readonly Mock<IAirportParkingService> _airportParkingService = new();

        public AirportParkingControllerTests()
        {
            _sut = new AirportParkingController(
                airportParkingService: _airportParkingService.Object,
                referenceDataService: _referenceDataService.Object
            ) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        }

        [Fact]
        public async Task Search_WhenIsExternalExtrasToggleIsOff_ReturnNotFound()
        {
            // Arrange
            var toggleOffSettings = new ExternalExtrasSettings() { IsExternalExtrasEnabledString = "0" };
            _referenceDataService.Setup(s => s.GetExternalExtrasSettings()).ReturnsAsync(toggleOffSettings);

            // Act
            var response = await _sut.Search(new AirportParkingSearchRequest());

            // Assert
            response.Should().BeOfType<NotFoundResult>();
            _referenceDataService.Verify(x => x.GetExternalExtrasSettings(), Times.Once);
        }

        [Fact]
        public async Task Search_WhenIsExternalExtrasToggleIsOn_ReturnParkingList()
        {
            // Arrange
            var request = new AirportParkingSearchRequest();

            var expectedResponse = new AirportParkingResponse();
            expectedResponse.AirportParkingItems.Add(new AirportParkingItem { Title = "Airport" });

            var toggleOnSettings = new ExternalExtrasSettings { IsExternalExtrasEnabledString = "1" };
            _referenceDataService.Setup(s => s.GetExternalExtrasSettings()).ReturnsAsync(toggleOnSettings);
            _airportParkingService.Setup(s => s.Search(request.Offer)).ReturnsAsync(expectedResponse);

            // Act
            var response = await _sut.Search(request);

            // Assert
            response.Should().BeOfType<OkObjectResult>();
            (response as OkObjectResult)?.Value.Should().BeEquivalentTo(expectedResponse);
            _referenceDataService.Verify(x => x.GetExternalExtrasSettings(), Times.Once);
        }

        [Fact]
        public async Task Search_WhenIsExternalExtrasToggleIsOffAndRequestIsNull_ReturnNotFound()
        {
            // Arrange
            var toggleOffSettings = new ExternalExtrasSettings { IsExternalExtrasEnabledString = "0" };
            _referenceDataService.Setup(s => s.GetExternalExtrasSettings()).ReturnsAsync(toggleOffSettings);

            // Act
            var response = await _sut.Search(null);

            // Assert
            response.Should().BeOfType<NotFoundResult>();
            _referenceDataService.Verify(x => x.GetExternalExtrasSettings(), Times.Once);
        }
    }
}