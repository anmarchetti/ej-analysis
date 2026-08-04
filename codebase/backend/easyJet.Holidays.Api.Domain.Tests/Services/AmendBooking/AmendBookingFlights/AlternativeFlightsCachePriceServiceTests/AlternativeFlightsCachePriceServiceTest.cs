using AutoFixture;
using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers;
using easyJet.Holidays.Tests.Domain;
using Moq;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendBookingFlights.AlternativeFlightsCachePriceServiceTests
{
    public class AlternativeFlightsCachePriceServiceTest
    {
        private readonly IFixture fixture = FixtureUtils.AutoMoqFixture();

        [Theory, AutoData]
        public async Task Hadnle_HandlersExecuted([Range(3, 7)] int numberOfValidators)
        {
            var handlers = fixture.CreateMany<Mock<IFlightCachePriceHandler>>(numberOfValidators);

            var sut = new AlternativeFlightsCachePriceService(handlers.Select(x => x.Object));

            await sut.Handle(new AlternativeFlightsCachePriceCalculationContext());

            foreach (var priceHandler in handlers)
            {
                priceHandler.Verify(x => x.Handle(It.IsAny<AlternativeFlightsCachePriceCalculationContext>()), Times.Once);
            }
        }
    }
}
