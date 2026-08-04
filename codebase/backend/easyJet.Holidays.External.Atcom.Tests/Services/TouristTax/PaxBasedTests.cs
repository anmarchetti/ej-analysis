using easyJet.Holidays.External.Atcom.Services.TouristTax;
using FluentAssertions;
using System;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.TouristTax;

public class PaxBasedTests
{
    private static TouristTaxOffer CreateOffer(string id, int starRating, int duration, int adults, int children)
    {
        var adultArr = new AdultPax[adults];
        for (int i = 0; i < adults; i++) adultArr[i] = new AdultPax();
        var childArr = new ChildPax[children];
        for (int i = 0; i < children; i++) childArr[i] = new ChildPax();
        return new(id, "ESXXX", duration, 0m, DateOnly.FromDateTime(DateTime.UtcNow.Date), DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(duration), starRating, 1,
            Array.AsReadOnly(adultArr), Array.AsReadOnly(childArr));
    }

    private static TouristTaxOffer CreateOfferWithChildAges(string id, int starRating, int duration, int adults, IReadOnlyList<uint> childAges)
    {
        var adultArr = new AdultPax[adults];
        for (int i = 0; i < adults; i++) adultArr[i] = new AdultPax();
        var childArr = new ChildPax[childAges.Count];
        for (int i = 0; i < childAges.Count; i++) childArr[i] = new ChildPax(null, childAges[i]);
        return new(id, "ESXXX", duration, 0m, DateOnly.FromDateTime(DateTime.UtcNow.Date), DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(duration), starRating, 1,
            Array.AsReadOnly(adultArr), Array.AsReadOnly(childArr));
    }

    [Fact]
    public async Task Calculate_MissingParams_LogsErrorAndUsesErrorCalculatorAsync()
    {
        var logger = new Mock<ILogger<PaxBased>>();
        var baselogger = new Mock<ILogger<CalculatorBase>>();
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.15m } });
        var sut = new PaxBased(logger.Object, baselogger.Object , new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O1", 4, 7, 2, 1);
        var rule = new TouristTaxRule();
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTax.Should().Be(-1m);
        tax.TouristTaxPP.Should().Be(-1m);
        logger.Verify(l => l.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Parameters required for PaxBased")),
            It.IsAny<Exception>(),
            (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task Calculate_PerStay_ComputesTax_WithCapsAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.15m } });
        var sut = new PaxBased(Mock.Of<ILogger<PaxBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O2", 4, 7, 2, 1);
        var rule = new TouristTaxRule
        {
            PaxRateAdult4Star = 10m,
            PaxRateChild4Star = 5m,
            PerNightOrPerStay = "PS",
            MaximumValueCap = 100m,
            MinimumValueCap = 0m,
            Currency = "EUR",
        };
        // adults=2, children=1 => tax = 2*10 + 1*5 = 25 < cap
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTaxLocal.Should().Be(25);
        tax.TouristTax.Should().Be(Math.Round(25 / 1.15m, 2, MidpointRounding.AwayFromZero));
        tax.TouristTaxPP.Should().Be(Math.Round(25 / 1.15m / 3, 2, MidpointRounding.AwayFromZero));
        tax.TouristTaxPPLocal.Should().Be(Math.Round(25m / 3, 2, MidpointRounding.AwayFromZero));
    }

    [Fact]
    public async Task Calculate_PerNight_RespectsMaxNightsCapAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.15m } });
        var sut = new PaxBased(Mock.Of<ILogger<PaxBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O3", 4, 10, 2, 2);
        var rule = new TouristTaxRule
        {
            PaxRateAdult4Star = 10m,
            PaxRateChild4Star = 5m,
            PerNightOrPerStay = "PN",
            MaximumNightsCap = 5,
            MaximumValueCap = 999m,
            MinimumValueCap = 0m,
            Currency = "EUR",
        };
        // adults=2, children=2, duration capped to 5 => tax = (2*5)*10 + (2*5)*5 = 100 + 50 = 150
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTaxLocal.Should().Be(150m);
        tax.TouristTaxPPLocal.Should().Be(150m / 4);
    }

    [Fact]
    public async Task Calculate_InvalidPerNightOrStay_LogsErrorAndUsesErrorCalculatorAsync()
    {
        var logger = new Mock<ILogger<PaxBased>>();
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.0m } });
        var sut = new PaxBased(logger.Object, Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O4", 4, 7, 1, 1);
        var rule = new TouristTaxRule
        {
            PaxRateAdult4Star = 10m,
            PaxRateChild4Star = 5m,
            PerNightOrPerStay = "BAD",
            Currency = "EUR",
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
    public async Task Calculate_WithChildAgeInclusive_ReclassifiesChildrenAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.0m } });
        var sut = new PaxBased(Mock.Of<ILogger<PaxBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOfferWithChildAges("O5", 4, 7, 2, new List<uint> { 10, 13 });
        var rule = new TouristTaxRule
        {
            PaxRateAdult4Star = 10m,
            PaxRateChild4Star = 5m,
            ChildAgeInclusive = "12",
            PerNightOrPerStay = "PS",
            Currency = "EUR",
        };

        var tax = await sut.Calculate(offer, rule);

        tax.TouristTaxLocal.Should().Be(35m);
        tax.TouristTax.Should().Be(35m);
        tax.TouristTaxPP.Should().Be(Math.Round(35m / 4, 2, MidpointRounding.AwayFromZero));
    }

    [Fact]
    public async Task Calculate_NoExchangeRate_ReturnsErrorAsync()
    {
        var logger = new Mock<ILogger<CalculatorBase>>();
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord>());
        var sut = new PaxBased(Mock.Of<ILogger<PaxBased>>(), logger.Object, new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O6", 4, 7, 1, 1);
        var rule = new TouristTaxRule
        {
            PaxRateAdult4Star = 10m,
            PaxRateChild4Star = 5m,
            PerNightOrPerStay = "PS",
            Currency = "EUR",
        };

        var tax = await sut.Calculate(offer, rule);

        tax.Currency.Should().Be("err");
        tax.TouristTax.Should().Be(-1m);
        logger.Verify(l => l.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No exchange rate found for currency")),
            It.IsAny<Exception>(),
            (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task Calculate_MinimumValueCap_AppliesFloorAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.0m } });
        var sut = new PaxBased(Mock.Of<ILogger<PaxBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O7", 4, 7, 1, 1);
        var rule = new TouristTaxRule
        {
            PaxRateAdult4Star = 1m,
            PaxRateChild4Star = 1m,
            PerNightOrPerStay = "PS",
            MinimumValueCap = 5m,
            MaximumValueCap = 999m,
            Currency = "EUR",
        };

        var tax = await sut.Calculate(offer, rule);

        tax.TouristTaxLocal.Should().Be(5m);
        tax.TouristTax.Should().Be(5m);
    }

    [Fact]
    public async Task Calculate_NegativeTotal_ReturnsErrorAsync()
    {
        var logger = new Mock<ILogger<CalculatorBase>>();
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.0m } });
        var sut = new PaxBased(Mock.Of<ILogger<PaxBased>>(), logger.Object, new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O8", 4, 7, 1, 1);
        var rule = new TouristTaxRule
        {
            PaxRateAdult4Star = -10m,
            PaxRateChild4Star = 0m,
            PerNightOrPerStay = "PS",
            Currency = "EUR",
        };

        var tax = await sut.Calculate(offer, rule);

        tax.Currency.Should().Be("err");
        tax.TouristTax.Should().Be(-1m);
        logger.Verify(l => l.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Tourist tax is less than zero")),
            It.IsAny<Exception>(),
            (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Once);
    }
}
