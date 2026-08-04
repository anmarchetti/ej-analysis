using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.PrisePromise;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.PricePromise;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class PricePromiseControllerTests
    {
        private readonly IFixture _fixture;

        private readonly PricePromiseController _sut;

        private readonly Mock<IPricePromiseService> _pricePromiseServiceMock;
        private readonly Mock<IBookingRepository> _bookingRepositoryMock;
        private readonly Mock<IMarketService> _marketServiceMock;

        public PricePromiseControllerTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _pricePromiseServiceMock = _fixture.Create<Mock<IPricePromiseService>>();
            _bookingRepositoryMock = _fixture.Create<Mock<IBookingRepository>>();
            _marketServiceMock = _fixture.Create<Mock<IMarketService>>();

            var awsSettings = new AwsSettings
            {
                PricePromiseMaxFiles = 1
            };
            _sut = new PricePromiseController(
                _pricePromiseServiceMock.Object,
                Options.Create(awsSettings),
                _marketServiceMock.Object,
                _bookingRepositoryMock.Object);
        }

        [Fact]
        public async Task Create_TooManyFiles_Fails()
        {
#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type.
            var model = new PricePromiseModel
            {
                Name = "John Doe",
                BookingReference = "123456",
                DepartureDate = DateTimeOffset.Now,
                SameDatesOfTravel = false,
                SameFlights = false,
                SamePartyComposition = false,
                SameRoomType = false,
                InclusiveOn23kg = false,
                BookedWithinLast24h = false,
                InclusiveOfTransfers = false,
                Link = "www.test.com",
                Screenshots = Enumerable.Repeat<IFormFile>(null, 2),
            };
#pragma warning restore CS8625 // Cannot convert null literal to non-nullable reference type.

            var apiException = await Assert.ThrowsAsync<ApiException>(async () => await _sut.Create(model));
            apiException.Code.Should().Be(ApiExceptionCodes.PricePromiseToBigFileOraLotFiles);
            apiException.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Create_UkMarket_MissingABTAAnswer_Fails()
        {
            _marketServiceMock
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "UK"
                });

            var model = new PricePromiseModel
            {
                Name = "John Doe",
                BookingReference = "123456",
                DepartureDate = DateTimeOffset.Now,
                SameDatesOfTravel = false,
                SameFlights = false,
                SamePartyComposition = false,
                SameRoomType = false,
                InclusiveOn23kg = false,
                BookedWithinLast24h = false,
                InclusiveOfTransfers = false,
                Link = "www.test.com",
                Screenshots = Array.Empty<IFormFile>()
            };

            var apiException = await Assert.ThrowsAsync<ApiException>(async () => await _sut.Create(model));
            apiException.Code.Should().Be(ApiExceptionCodes.PricePromiseMissingABTA);
            apiException.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Create_NonUkMarket_MissingABTAAnswer_Succeeds()
        {
            _marketServiceMock
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "CH"
                });

            var model = new PricePromiseModel
            {
                Name = "John Doe",
                BookingReference = "123456",
                DepartureDate = DateTimeOffset.Now,
                SameDatesOfTravel = false,
                SameFlights = false,
                SamePartyComposition = false,
                SameRoomType = false,
                InclusiveOn23kg = false,
                BookedWithinLast24h = false,
                InclusiveOfTransfers = false,
                Link = "www.test.com",
                Screenshots = Array.Empty<IFormFile>()
            };

            var response = await _sut.Create(model) as ObjectResult;
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
        }

        [Fact]
        public async Task Create_FoundBooking_EnrichedWithMarketCode()
        {
            _marketServiceMock
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "CH"
                });

            _bookingRepositoryMock
                .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new Data.Booking.BookingResponse { MarketCode = "UK" });

            var model = new PricePromiseModel
            {
                Name = "John Doe",
                BookingReference = "123456",
                DepartureDate = DateTimeOffset.Now,
                SameDatesOfTravel = false,
                SameFlights = false,
                SamePartyComposition = false,
                SameRoomType = false,
                InclusiveOn23kg = false,
                BookedWithinLast24h = false,
                InclusiveOfTransfers = false,
                Link = "www.test.com",
                Screenshots = Array.Empty<IFormFile>()
            };

            await _sut.Create(model);

            _pricePromiseServiceMock.Verify(x => x.Create(It.Is<PricePromiseModel>(x => x.MarketCode == "UK")));
        }

        [Fact]
        public async Task Create_NoBooking_NoMarketCode()
        {
            _marketServiceMock
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "CH"
                });

            var model = new PricePromiseModel
            {
                Name = "John Doe",
                BookingReference = "123456",
                DepartureDate = DateTimeOffset.Now,
                SameDatesOfTravel = false,
                SameFlights = false,
                SamePartyComposition = false,
                SameRoomType = false,
                InclusiveOn23kg = false,
                BookedWithinLast24h = false,
                InclusiveOfTransfers = false,
                Link = "www.test.com",
                Screenshots = Array.Empty<IFormFile>()
            };

            await _sut.Create(model);

            _pricePromiseServiceMock.Verify(x => x.Create(It.Is<PricePromiseModel>(x => x.MarketCode == null)));
        }
    }
}
