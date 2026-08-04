using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Services.Market;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Tests.Controllers;

public class SeatsControllerTests
{

    [Fact]
    public async Task GetSeatsMap_WhenServiceReturnMap_ShouldReturnOkResponse()
    {
        // Arrange
        var seatingServiceMock = new Mock<ISeatingService>();

        var expectedResponsePayload = new GetSeatsMapResponse
        {
            AircraftType = new AircraftType(),
        };
        seatingServiceMock
            .Setup(x => x.GetSeatsMap(It.IsAny<GetSeatsMapRequest>(), true))
            .ReturnsAsync(expectedResponsePayload);
        var marketServiceMock = new Mock<IMarketService>();
        marketServiceMock
            .Setup(x => x.GetCurrentMarket())
            .Returns(new MarketSettings
            {
                Currency = Currency.GBP
            });

        var sut = new SeatsController(seatingServiceMock.Object, marketServiceMock.Object);

        // Act
        var response = await sut.GetSeatsMap(new GetSeatsMapRequest());

        // Assert
        response.Should().NotBeNull();
        response.Should().BeOfType<OkObjectResult>();
        response.As<OkObjectResult>().Value.Should().BeEquivalentTo(expectedResponsePayload);

    }

    [Fact]
    public async Task GetSeatsMap_WhenServiceReturnNull_ShouldReturnNull()
    {
        // Arrange
        var seatingServiceMock = new Mock<ISeatingService>();
        var marketServiceMock = new Mock<IMarketService>();
        var sut = new SeatsController(seatingServiceMock.Object, marketServiceMock.Object);

        // Act
        var response = await sut.GetSeatsMap(null);

        // Assert
        response.Should().BeNull();

    }

    [Theory]
    [AutoData]
    public async Task GetSeatsMap_WhenServiceReturnMap_ShouldReturnCurrencyFromRequest(Currency currency)
    {
        ArgumentNullException.ThrowIfNull(currency);

        // Arrange
        var seatingServiceMock = new Mock<ISeatingService>();
        var expectedResponsePayload = new GetSeatsMapResponse
        {
            AircraftType = new AircraftType(),
            CurrencyCode = currency.Code
        };
        seatingServiceMock
            .Setup(x => x.GetSeatsMap(It.IsAny<GetSeatsMapRequest>(), true))
            .ReturnsAsync(expectedResponsePayload);

        var marketServiceMock = new Mock<IMarketService>();
        marketServiceMock
            .Setup(x => x.GetCurrentMarket())
            .Returns(new MarketSettings
            {
                Currency = currency
            });
        var sut = new SeatsController(seatingServiceMock.Object, marketServiceMock.Object);

        // Act
        var response = await sut.GetSeatsMap(new GetSeatsMapRequest() { CurrencyCode = currency.Code });

        // Assert
        response.Should().NotBeNull();
        seatingServiceMock.Verify(x => x.GetSeatsMap(It.Is<GetSeatsMapRequest>(y =>
                    y.CurrencyCode == currency.Code),
                It.IsAny<bool>()), $"Invalid currency, should be {currency.Code}");
    }
    [Theory]
    [AutoData]
    public async Task GetSeatsMap_WhenRequestDoesNotContainCurrencyCode_ShouldReturnCurrencyCodeFallBackFromMarketServiceFromRequest(Currency currency)
    {
        ArgumentNullException.ThrowIfNull(currency);
        // Arrange
        var seatingServiceMock = new Mock<ISeatingService>();
        var expectedResponsePayload = new GetSeatsMapResponse
        {
            AircraftType = new AircraftType(),

        };
        seatingServiceMock
            .Setup(x => x.GetSeatsMap(It.IsAny<GetSeatsMapRequest>(), true))
            .ReturnsAsync(expectedResponsePayload);

        var marketServiceMock = new Mock<IMarketService>();

        marketServiceMock
            .Setup(x => x.GetCurrentMarket())
            .Returns(new MarketSettings
            {
                Currency = currency
            });
        var sut = new SeatsController(seatingServiceMock.Object, marketServiceMock.Object);

        // Act
        var response = await sut.GetSeatsMap(new GetSeatsMapRequest());

        // Assert
        response.Should().NotBeNull();
        seatingServiceMock.Verify(x => x.GetSeatsMap(It.Is<GetSeatsMapRequest>(y =>
                    y.CurrencyCode == currency.Code),
                It.IsAny<bool>()), $"Invalid currency, should be {currency.Code}");
    }
}