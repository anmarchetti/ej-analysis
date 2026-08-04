using easyJet.Holidays.External.Atcom.Services.TouristTax;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.TouristTax;

public class NoTaxCalculatorTests
{
    [Fact]
    public void Calculate_SetsZero()
    {
        var sut = new NoTaxCalculator();
        var offer = new TouristTaxOffer("O1", "ES", 7, 0m, DateOnly.FromDateTime(DateTime.UtcNow.Date), DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(7), 3, 1,
            Array.AsReadOnly(new AdultPax[] { new() }), Array.AsReadOnly(Array.Empty<ChildPax>()));
        var tax = sut.Calculate(offer);
        tax.TouristTax.Should().Be(0m);
        tax.TouristTaxPP.Should().Be(0m);
    }
}
