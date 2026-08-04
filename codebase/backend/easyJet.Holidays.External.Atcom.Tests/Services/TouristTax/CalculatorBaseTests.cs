using easyJet.Holidays.External.Atcom.Services.TouristTax;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.TouristTax;

public class CalculatorBaseTests
{
    private sealed class TestCalculator : CalculatorBase
    {
        public TestCalculator(ILogger<CalculatorBase> logger, IErrorBasedCalculator errorCalculator, ITouristTaxRepository touristTaxRepository)
            : base(logger, errorCalculator, touristTaxRepository)
        {
        }

        public decimal? GetPropertyValueProxy(TouristTaxRule rule, string propertyName) => GetPropertyValue(rule, propertyName);

        public OfferTax ValidateOrErrorProxy(decimal touristTax, string offerId) => ValidateOrError(touristTax, offerId);

        public decimal GetTouristTaxPerPersonProxy(decimal totalTax, int totalPaxes) => GetTouristTaxPerPerson(totalTax, totalPaxes);

        public Task<OfferTax> HydrateExchangeRateInfoProxy(OfferTax offerTax, string ruleCurrency) => HydrateExchangeRateInfo(offerTax, ruleCurrency);

        public decimal Round2Proxy(decimal value) => Round2(value);

        public void ApplyCapToLocalTaxProxy(TouristTaxRule rule, OfferTax offerTax) => ApplyCapToLocalTax(rule, offerTax);
    }

    [Fact]
    public void GetPropertyValue_ReturnsDecimal_WhenPropertyExists()
    {
        var sut = CreateSut();
        var rule = new TouristTaxRule { PaxRateAdult4Star = 12.5m };

        var value = sut.GetPropertyValueProxy(rule, "PaxRateAdult4Star");

        value.Should().Be(12.5m);
    }

    [Fact]
    public void GetPropertyValue_ReturnsParsedDecimal_WhenPropertyIsString()
    {
        var sut = CreateSut();
        var rule = new TouristTaxRule { ChildAgeInclusive = "12" };

        var value = sut.GetPropertyValueProxy(rule, "ChildAgeInclusive");

        value.Should().Be(12m);
    }

    [Fact]
    public void GetPropertyValue_ReturnsNull_WhenPropertyMissing()
    {
        var sut = CreateSut();
        var rule = new TouristTaxRule();

        var value = sut.GetPropertyValueProxy(rule, "DoesNotExist");

        value.Should().BeNull();
    }

    [Fact]
    public void ValidateOrError_ReturnsError_WhenNegative()
    {
        var errorCalculator = new Mock<IErrorBasedCalculator>(MockBehavior.Strict);
        errorCalculator.Setup(e => e.Calculate("O1")).Returns(new OfferTax("O1") { TouristTax = -1, Currency = "err" });
        var sut = CreateSut(errorCalculator: errorCalculator);

        var result = sut.ValidateOrErrorProxy(-1m, "O1");

        result.Should().NotBeNull();
        result!.Currency.Should().Be("err");
    }

    [Fact]
    public void ValidateOrError_ReturnsNull_WhenNonNegative()
    {
        var sut = CreateSut();

        var result = sut.ValidateOrErrorProxy(0m, "O2");

        result.Should().BeNull();
    }

    [Fact]
    public void GetTouristTaxPerPerson_Divides_WhenPaxesPositive()
    {
        var sut = CreateSut();

        var value = sut.GetTouristTaxPerPersonProxy(10m, 4);

        value.Should().Be(2.5m);
    }

    [Fact]
    public void GetTouristTaxPerPerson_ReturnsTotal_WhenNoPaxes()
    {
        var sut = CreateSut();

        var value = sut.GetTouristTaxPerPersonProxy(10m, 0);

        value.Should().Be(10m);
    }

    [Fact]
    public async Task HydrateExchangeRateInfo_SetsRate_WhenMatchFound()
    {
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord>
        {
            new() { UserCurrency = "GBP", HotelCurrency = "EUR", ExchangeRate = 1.2m }
        });
        var errorCalculator = new Mock<IErrorBasedCalculator>(MockBehavior.Strict);
        var sut = CreateSut(repo: repo, errorCalculator: errorCalculator);
        var offerTax = new OfferTax("O3");

        var result = await sut.HydrateExchangeRateInfoProxy(offerTax, "EUR");

        result.ExchangeRate.Should().Be(1.2m);
        result.Currency.Should().Be("EUR");
    }

    [Fact]
    public async Task HydrateExchangeRateInfo_ReturnsError_WhenNoMatch()
    {
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord>());
        var errorCalculator = new Mock<IErrorBasedCalculator>(MockBehavior.Strict);
        errorCalculator.Setup(e => e.Calculate("O4")).Returns(new OfferTax("O4") { Currency = "err" });
        var sut = CreateSut(repo: repo, errorCalculator: errorCalculator);
        var offerTax = new OfferTax("O4");

        var result = await sut.HydrateExchangeRateInfoProxy(offerTax, "EUR");

        result.Currency.Should().Be("err");
    }

    [Fact]
    public void Round2_RoundsAwayFromZero()
    {
        var sut = CreateSut();

        var value = sut.Round2Proxy(1.005m);

        value.Should().Be(1.01m);
    }

    [Fact]
    public void ApplyCapToLocalTax_ClampsToMinAndMax()
    {
        var sut = CreateSut();
        var rule = new TouristTaxRule { MinimumValueCap = 10m, MaximumValueCap = 20m };
        var offerTax = new OfferTax("O5") { TouristTaxLocal = 5m };

        sut.ApplyCapToLocalTaxProxy(rule, offerTax);
        offerTax.TouristTaxLocal.Should().Be(10m);

        offerTax.TouristTaxLocal = 25m;
        sut.ApplyCapToLocalTaxProxy(rule, offerTax);
        offerTax.TouristTaxLocal.Should().Be(20m);
    }

    private static TestCalculator CreateSut(
        Mock<ITouristTaxRepository> repo = null,
        Mock<IErrorBasedCalculator> errorCalculator = null)
    {
        var repoProvided = repo is not null;
        var errorProvided = errorCalculator is not null;

        repo ??= new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        errorCalculator ??= new Mock<IErrorBasedCalculator>(MockBehavior.Strict);
        var logger = Mock.Of<ILogger<CalculatorBase>>();

        if (!repoProvided)
        {
            repo.Setup(r => r.GetExchangeRates()).ReturnsAsync(new List<ExchangeRateRecord>());
        }

        if (!errorProvided)
        {
            errorCalculator.Setup(e => e.Calculate(It.IsAny<string>())).Returns(new OfferTax("ERR") { Currency = "err" });
        }

        return new TestCalculator(logger, errorCalculator.Object, repo.Object);
    }
}
