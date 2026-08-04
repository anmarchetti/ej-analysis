using easyJet.Holidays.Api.Domain.Data.Eskel;
using easyJet.Holidays.Api.Domain.Interfaces.Eskel;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.Eskel.Models;
using easyJet.Holidays.External.Eskel.Services;
using easyJet.Holidays.External.Eskel.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Eskel.Tests.Services
{
    public class EskelServiceTests
    {
        private readonly Mock<IApiService> _apiServiceMock;
        private readonly EskelSettings _eskelSettings;
        private readonly Mock<ILogger<IEskelService>> _loggerMock;

        private readonly EskelService _sut;

        public EskelServiceTests()
        {
            _apiServiceMock = new Mock<IApiService>();
            _eskelSettings = new EskelSettings()
            {
                AtcomBookingDetailsUrl = @"https://test.endpoint:1234",
            };
            _loggerMock = new Mock<ILogger<IEskelService>>();

            _sut = new EskelService(
                _apiServiceMock.Object,
                _eskelSettings,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task GetBookingByCreatedDate_WhenBookingsExist_ReturnsBookings()
        {
            // Arrange
            var createdDate = new DateTime(2021, 04, 04);
            var bookings = new Booking[]
            {
                new Booking
                {
                    CreatedDateTime = createdDate,
                    ReseverationId = 7349
                }
            };
            var response = new BookingsResponse()
            {
                Payload = new JsonApiPayload<Booking[]>
                {
                    Body = bookings
                }
            };
            _apiServiceMock
                .Setup(x => x.GetResponseContentAsync<BookingsRequest, BookingsResponse>(It.Is<BookingsRequest>(y => y.CreatedDate == "2021-04-04")))
                .ReturnsAsync(response);

            // Act
            var res = await _sut.GetBookingsByCreatedDate(createdDate);

            // Assert
            res.Should().BeEquivalentTo(bookings);
        }

        [Fact]
        public async Task GetBookingByCreatedDate_WhenBookingsDontExist_ReturnsEmptyArray()
        {
            // Arrange
            var createdDate = new DateTime(2021, 04, 04);
            var bookings = new Booking[] { };
            var response = new BookingsResponse()
            {
                Payload = new JsonApiPayload<Booking[]>
                {
                    Body = bookings
                }
            };
            _apiServiceMock
                .Setup(x => x.GetResponseContentAsync<BookingsRequest, BookingsResponse>(It.Is<BookingsRequest>(y => y.CreatedDate == "2021-04-04")))
                .ReturnsAsync(response);

            // Act
            var res = await _sut.GetBookingsByCreatedDate(createdDate);

            // Assert
            res.Should().BeEquivalentTo(bookings);
        }
    }
}
