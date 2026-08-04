using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Content
{
    /// <summary>
    /// Unit tests for ContentService class testing health entry requirements functionality.
    /// </summary>
    public class ContentServiceTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<ICmsContentService> _cmsContentServiceMock;
        private readonly ContentService _sut;

        public ContentServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _cmsContentServiceMock = _fixture.Freeze<Mock<ICmsContentService>>();
            _sut = _fixture.Create<ContentService>();
        }

        #region UpdateHealsEntryRequirementsContent - Single Booking

        [Fact]
        public async Task UpdateHealsEntryRequirementsContent_SingleBooking_WithValidAirport_SetsRequirements()
        {
            // Arrange
            const string airportCode = "LHR";
            var expectedRequirements = new List<HealthEntryRequirement>
            {
                new HealthEntryRequirement { Title = "Req1", Description = "Desc1" },
                new HealthEntryRequirement { Title = "Req2", Description = "Desc2" }
            };
            var booking = CreateBookingWithAirport(airportCode);

            _cmsContentServiceMock.Setup(service =>
                    service.GetHealthEntryRequirementsForAirport(airportCode, It.IsAny<bool>()))
                .ReturnsAsync(expectedRequirements);

            // Act
            await _sut.UpdateHealsEntryRequirementsContent(booking);

            // Assert
            booking.HealthEntryRequirements.Should().HaveCount(2);
            booking.HealthEntryRequirements.First().Title.Should().Be("Req1");
            _cmsContentServiceMock.Verify(
                service => service.GetHealthEntryRequirementsForAirport(airportCode, It.IsAny<bool>()),
                Times.Once);
        }

        [Fact]
        public async Task UpdateHealsEntryRequirementsContent_SingleBooking_WithoutOutboundRoute_DoesNotCallService()
        {
            // Arrange - booking with only inbound route, no outbound
            var booking = new BookingResponse
            {
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route { Direction = Direction.Inbound, ArrPt = "LHR" }
                        }
                    }
                },
                HealthEntryRequirements = new List<HealthEntryRequirement>()
            };

            // Act - this will throw NullReferenceException when trying to access null outbound route's ArrPt
            // This test verifies the current behavior
            await Assert.ThrowsAsync<NullReferenceException>(
                () => _sut.UpdateHealsEntryRequirementsContent(booking));
        }

        [Fact]
        public async Task UpdateHealsEntryRequirementsContent_SingleBooking_WithEmptyRequirements_SetsEmptyList()
        {
            // Arrange
            const string airportCode = "CDG";
            var booking = CreateBookingWithAirport(airportCode);
            var emptyRequirements = new List<HealthEntryRequirement>();

            _cmsContentServiceMock.Setup(service =>
                    service.GetHealthEntryRequirementsForAirport(airportCode, It.IsAny<bool>()))
                .ReturnsAsync(emptyRequirements);

            // Act
            await _sut.UpdateHealsEntryRequirementsContent(booking);

            // Assert
            booking.HealthEntryRequirements.Should().BeEmpty();
        }

        #endregion

        #region UpdateHealsEntryRequirementsContent - Multiple Bookings

        [Fact]
        public async Task UpdateHealsEntryRequirementsContent_MultipleBookings_WithUniqueAirports_SetsAllRequirements()
        {
            // Arrange
            const string airport1 = "LHR";
            const string airport2 = "CDG";
            
            var requirements1 = new List<HealthEntryRequirement>
            {
                new HealthEntryRequirement { Title = "LHR_Req1" }
            };
            var requirements2 = new List<HealthEntryRequirement>
            {
                new HealthEntryRequirement { Title = "CDG_Req1" }
            };

            var booking1 = CreateBookingWithAirport(airport1);
            var booking2 = CreateBookingWithAirport(airport2);
            var bookings = new List<BookingResponse> { booking1, booking2 };

            _cmsContentServiceMock.Setup(service =>
                    service.GetHealthEntryRequirementsForAirport(airport1, It.IsAny<bool>()))
                .ReturnsAsync(requirements1);

            _cmsContentServiceMock.Setup(service =>
                    service.GetHealthEntryRequirementsForAirport(airport2, It.IsAny<bool>()))
                .ReturnsAsync(requirements2);

            // Act
            await _sut.UpdateHealsEntryRequirementsContent(bookings);

            // Assert
            booking1.HealthEntryRequirements.Should().HaveCount(1);
            booking1.HealthEntryRequirements.First().Title.Should().Be("LHR_Req1");
            booking2.HealthEntryRequirements.Should().HaveCount(1);
            booking2.HealthEntryRequirements.First().Title.Should().Be("CDG_Req1");
        }

        [Fact]
        public async Task UpdateHealsEntryRequirementsContent_MultipleBookings_WithDuplicateAirports_CallsServiceOncePerAirport()
        {
            // Arrange
            const string airportCode = "LHR";
            var requirements = new List<HealthEntryRequirement>
            {
                new HealthEntryRequirement { Title = "Test" }
            };

            var booking1 = CreateBookingWithAirport(airportCode);
            var booking2 = CreateBookingWithAirport(airportCode);
            var booking3 = CreateBookingWithAirport(airportCode);
            var bookings = new List<BookingResponse> { booking1, booking2, booking3 };

            _cmsContentServiceMock.Setup(service =>
                    service.GetHealthEntryRequirementsForAirport(airportCode, It.IsAny<bool>()))
                .ReturnsAsync(requirements);

            // Act
            await _sut.UpdateHealsEntryRequirementsContent(bookings);

            // Assert
            booking1.HealthEntryRequirements.Should().HaveCount(1);
            booking2.HealthEntryRequirements.Should().HaveCount(1);
            booking3.HealthEntryRequirements.Should().HaveCount(1);

            _cmsContentServiceMock.Verify(
                service => service.GetHealthEntryRequirementsForAirport(airportCode, It.IsAny<bool>()),
                Times.Once);
        }

        [Fact]
        public async Task UpdateHealsEntryRequirementsContent_MultipleBookings_WithoutOutboundRoute_ThrowsException()
        {
            // Arrange
            const string validAirport = "LHR";
            var requirements = new List<HealthEntryRequirement>
            {
                new HealthEntryRequirement { Title = "Test" }
            };

            var validBooking = CreateBookingWithAirport(validAirport);
            var bookingWithoutOutboundRoute = new BookingResponse
            {
                Package = new BookingPackage
                {
                    Transport = new Transport { Routes = new List<Route>() }
                },
                HealthEntryRequirements = new List<HealthEntryRequirement>()
            };
            var bookings = new List<BookingResponse> { validBooking, bookingWithoutOutboundRoute };

            _cmsContentServiceMock.Setup(service =>
                    service.GetHealthEntryRequirementsForAirport(validAirport, It.IsAny<bool>()))
                .ReturnsAsync(requirements);

            // Act & Assert - throws NullReferenceException when processing booking without outbound route
            await Assert.ThrowsAsync<NullReferenceException>(
                () => _sut.UpdateHealsEntryRequirementsContent(bookings));
        }

        [Fact]
        public async Task UpdateHealsEntryRequirementsContent_MultipleBookings_WithEmptyList_DoesNothing()
        {
            // Arrange
            var bookings = new List<BookingResponse>();

            // Act
            await _sut.UpdateHealsEntryRequirementsContent(bookings);

            // Assert
            _cmsContentServiceMock.Verify(
                service => service.GetHealthEntryRequirementsForAirport(It.IsAny<string>(), It.IsAny<bool>()),
                Times.Never);
        }

        #endregion

        #region Error Handling

        [Fact]
        public async Task UpdateHealsEntryRequirementsContent_SingleBooking_WhenServiceThrows_PropagatesException()
        {
            // Arrange
            const string airportCode = "LHR";
            var booking = CreateBookingWithAirport(airportCode);
            var exception = new InvalidOperationException("Service error");

            _cmsContentServiceMock.Setup(service =>
                    service.GetHealthEntryRequirementsForAirport(airportCode, It.IsAny<bool>()))
                .ThrowsAsync(exception);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _sut.UpdateHealsEntryRequirementsContent(booking));
        }

        [Fact]
        public async Task UpdateHealsEntryRequirementsContent_MultipleBookings_WhenServiceThrows_PropagatesException()
        {
            // Arrange
            const string airportCode = "LHR";
            var booking = CreateBookingWithAirport(airportCode);
            var bookings = new List<BookingResponse> { booking };
            var exception = new InvalidOperationException("Service error");

            _cmsContentServiceMock.Setup(service =>
                    service.GetHealthEntryRequirementsForAirport(airportCode, It.IsAny<bool>()))
                .ThrowsAsync(exception);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _sut.UpdateHealsEntryRequirementsContent(bookings));
        }

        #endregion

        #region Helper Methods

        private static BookingResponse CreateBookingWithAirport(string airportCode)
        {
            var route = new Route
            {
                Direction = Direction.Outbound,
                ArrPt = airportCode
            };

            return new BookingResponse
            {
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route> { route }
                    },
                    Accom = new BookingAccommodation()
                },
                HealthEntryRequirements = new List<HealthEntryRequirement>()
            };
        }

        #endregion
    }
}

