using easyJet.Holidays.External.Atcom.Services.TouristTax;
using FluentAssertions;
using System;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.TouristTax;

public class RoomBasedTests
{
    private static TouristTaxOffer CreateOffer(string id, int starRating, int adults, int children, int numberOfRooms = 2)
        => new(id, "GBSS45", 7, 0m, DateOnly.FromDateTime(DateTime.UtcNow.Date), DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(7), starRating, numberOfRooms,
            new AdultPax[adults].AsReadOnly(), new ChildPax[children].AsReadOnly());

    [Fact]
    public async Task Calculate_ComputesTax_RespectsCaps_AndPPAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.15m } });
        var sut = new RoomBased(Mock.Of<ILogger<RoomBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O2", 3, 3, 1, 2);
        var rule = new TouristTaxRule
        {
            RoomRate3Star = 100m,
            MaximumValueCap = 250m,
            MinimumValueCap = 50m,
            Currency = "EUR",
            PerNightOrPerStay = "PS",
        };
        // rooms = 2, chargePerRoom = 100 => total = 200
        // occupants = 3 adults + 1 child = 4
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTaxLocal.Should().Be(200m);
        tax.TouristTaxPPLocal.Should().Be(200m / 4);
        tax.TouristTax.Should().Be(Math.Round(200m / 1.15m, 2, MidpointRounding.AwayFromZero));
        tax.TouristTaxPP.Should().Be(Math.Round((200m / 4) / 1.15m, 2, MidpointRounding.AwayFromZero));
    }

    [Fact]
    public async Task Calculate_MissingRate_UsesErrorCalculatorAsync()
    {
        var logger = new Mock<ILogger<RoomBased>>();
        var baseLogger = new Mock<ILogger<CalculatorBase>>();
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.2m } });
        var sut = new RoomBased(logger.Object, baseLogger.Object, new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("R1", 3, 2, 2, 1);
        var rule = new TouristTaxRule { Currency = "EUR" };
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTax.Should().Be(-1m);
        logger.Verify(l => l.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Parameters required for RoomBased")),
            It.IsAny<Exception>(),
            (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task Calculate_ComputesLocalTax_RespectsCaps_AndPPAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.2m } });
        var sut = new RoomBased(Mock.Of<ILogger<RoomBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("R2", 3, 2, 3, 1); // 4 occupants
        var rule = new TouristTaxRule
        {
            RoomRate3Star = 100m,
            MaximumValueCap = 250m,
            MinimumValueCap = 50m,
            Currency = "EUR",
            PerNightOrPerStay = "PS",
        };
        var tax = await sut.Calculate(offer, rule);
        // rooms = 2, chargePerRoom = 100 => totalLocal = 200; within caps
        tax.TouristTaxLocal.Should().Be(100m);
        tax.TouristTax.Should().Be(Math.Round(100m / 1.2m, 2, MidpointRounding.AwayFromZero));
        tax.TouristTaxPP.Should().Be(Math.Round(tax.TouristTax / 5, 2, MidpointRounding.AwayFromZero));
        tax.TouristTaxPPLocal.Should().Be(Math.Round(100m / 5, 2, MidpointRounding.AwayFromZero));
    }

    [Fact]
    public async Task Calculate_PerNight_MultipliesByDurationAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.25m } });
        var sut = new RoomBased(Mock.Of<ILogger<RoomBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        // Default duration in helper is 7 nights
        var offer = CreateOffer("PN1", 4, 2, 1, 2); // 3 occupants, 2 rooms, 7 nights
        var rule = new TouristTaxRule
        {
            RoomRate4Star = 50m, // per room per night
            MaximumValueCap = 2000m,
            MinimumValueCap = 0m,
            Currency = "EUR",
            PerNightOrPerStay = "PN",
        };
        // rooms = 2, rate = 50, nights = 7 ? local total = 2 * 50 * 7 = 700
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTaxLocal.Should().Be(700m);
        tax.TouristTaxPPLocal.Should().Be(Math.Round(700m / 3, 2, MidpointRounding.AwayFromZero));
        tax.TouristTax.Should().Be(Math.Round(700m / 1.25m, 2, MidpointRounding.AwayFromZero));
        tax.TouristTaxPP.Should().Be(Math.Round((700m / 3) / 1.25m, 2, MidpointRounding.AwayFromZero));
    }

    [Fact]
    public async Task Calculate_Invalid_PerNightOrPerStay_UsesErrorCalculatorAsync()
    {
        var logger = new Mock<ILogger<RoomBased>>();
        var baseLogger = new Mock<ILogger<CalculatorBase>>();
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.0m } });
        var sut = new RoomBased(logger.Object, baseLogger.Object, new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("INV1", 3, 2, 0, 1);
        var rule = new TouristTaxRule
        {
            RoomRate3Star = 75m,
            Currency = "EUR",
            PerNightOrPerStay = "INVALID",
        };
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTax.Should().Be(-1m);
        logger.Verify(l => l.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Invalid PerNightOrPerStay value")),
            It.IsAny<Exception>(),
            (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task Calculate_PerNight_RespectsMaximumNightsCapAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 2.0m } });
        var sut = new RoomBased(Mock.Of<ILogger<RoomBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        // Create a 10-night offer to test cap
        var start = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var offer = new TouristTaxOffer("CAP1", "GBSS45", 10, 0m, start, start.AddDays(10), 3, 2, new AdultPax[2].AsReadOnly(), new ChildPax[1].AsReadOnly());
        var rule = new TouristTaxRule
        {
            RoomRate3Star = 40m,
            Currency = "EUR",
            PerNightOrPerStay = "PN",
            MaximumNightsCap = 5, // cap nights to 5
        };
        // rooms = 2, rate = 40, capped nights = 5 ? local total = 2 * 40 * 5 = 400
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTaxLocal.Should().Be(400m);
        tax.TouristTax.Should().Be(Math.Round(400m / 2.0m, 2, MidpointRounding.AwayFromZero));
    }

    [Fact]
    public async Task Calculate_MissingExchangeRate_ReturnsErrorAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        // Return rates that do not match rule currency
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "USD", ExchangeRate = 1.0m } });
        var sut = new RoomBased(Mock.Of<ILogger<RoomBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("EXRERR", 3, 2, 1, 1);
        var rule = new TouristTaxRule
        {
            RoomRate3Star = 80m,
            Currency = "EUR", // no matching rate
            PerNightOrPerStay = "PS",
        };
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTax.Should().Be(-1m);
        tax.Currency.Should().Be("err");
    }
}
