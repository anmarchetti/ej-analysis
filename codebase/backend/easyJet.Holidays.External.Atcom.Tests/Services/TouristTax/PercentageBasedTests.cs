using easyJet.Holidays.External.Atcom.Services.TouristTax;
using FluentAssertions;
using System;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.TouristTax;

public class PercentageBasedTests
{
    private static TouristTaxOffer CreateOffer(string id, int starRating, decimal accommodationAmount, int adults, int children)
    {
        var adultArr = new AdultPax[adults];
        for (int i = 0; i < adults; i++) adultArr[i] = new AdultPax();
        var childArr = new ChildPax[children];
        for (int i = 0; i < children; i++) childArr[i] = new ChildPax();
        return new(id, "ESFU13", 7, accommodationAmount, DateOnly.FromDateTime(DateTime.UtcNow.Date), DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(7), starRating, 1,
            Array.AsReadOnly(adultArr), Array.AsReadOnly(childArr));
    }

    [Fact]
    public async Task Calculate_PercentageRateMissing_UsesErrorCalculatorAsync()
    {
        var logger = new Mock<ILogger<PercentageBased>>();
        var baseLogger = new Mock<ILogger<CalculatorBase>>();
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.15m } });
        var sut = new PercentageBased(logger.Object, baseLogger.Object, new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O1", 4, 1000m - 300m, 2, 1);
        var rule = new TouristTaxRule
        {
            MaximumValueCap = 1000m,
            MinimumValueCap = 0m,
        };
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTax.Should().Be(-1m);
        tax.TouristTaxPP.Should().Be(-1m);
        logger.Verify(l => l.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Parameters required for PercentageBased")),
            It.IsAny<Exception>(),
            (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task Calculate_ComputesTaxAndPP_WithCapAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.15m } });
        var sut = new PercentageBased(Mock.Of<ILogger<PercentageBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O2", 4, 1200m, 5, 0);
        var rule = new TouristTaxRule
        {
            MaximumValueCap = 30m,
            PercentageRate4Star = 0.2m,
            PercentageRate5Star = 0.5m,
            PercentageRate3Star = 0.5m,
            MinimumValueCap = 3m,
            Currency = "EUR",
        };
        var tax = await sut.Calculate(offer, rule);
        // tax local = accomAmount * (rate/100) = 1200 * 0.002 = 2.4; min cap applied to local tax -> 3
        tax.TouristTaxLocal.Should().Be(3m);
        tax.TouristTax.Should().Be(Math.Round(3m / 1.15m, 2, MidpointRounding.AwayFromZero));
        tax.TouristTaxPP.Should().Be(Math.Round(tax.TouristTax / 5, 2, MidpointRounding.AwayFromZero));
        tax.TouristTaxPPLocal.Should().Be(Math.Round(3m / 5, 2, MidpointRounding.AwayFromZero));
    }

    [Fact]
    public async Task Calculate_AppliesMaxCapAsync()
    {
        var repo = new Mock<ITouristTaxRepository>();
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord> { new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.15m } });
        var sut = new PercentageBased(Mock.Of<ILogger<PercentageBased>>(), Mock.Of<ILogger<CalculatorBase>>(), new ErrorBasedCalculator(), repo.Object);
        var offer = CreateOffer("O3", 5, 4800m, 4, 0);
        var rule = new TouristTaxRule
        {
            MaximumValueCap = 20m,
            PercentageRate5Star = 0.5m,
            PercentageRate3Star = 0.5m,
            PercentageRate4Star = 0.5m,
            MinimumValueCap = 3m,
            Currency = "EUR",
        };
        var tax = await sut.Calculate(offer, rule);
        tax.TouristTaxLocal.Should().Be(20m);
    }
}
