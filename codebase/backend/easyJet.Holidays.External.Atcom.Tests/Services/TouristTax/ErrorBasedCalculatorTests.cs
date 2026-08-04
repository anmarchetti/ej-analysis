using easyJet.Holidays.External.Atcom.Services.TouristTax;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.TouristTax;

public class ErrorBasedCalculatorTests
{
    [Fact]
    public void Calculate_ReturnsErrorValues()
    {
        var calc = new ErrorBasedCalculator();
        var offer = new TouristTaxOffer("O-ERR", "ZZ", 7, 0m, DateOnly.FromDateTime(DateTime.UtcNow.Date), DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(7), 3, 1,
            Array.AsReadOnly(new[] { new AdultPax() }), Array.AsReadOnly(Array.Empty<ChildPax>()));

        var tax = calc.Calculate(offer.OfferId);
        tax.OfferId.Should().Be("O-ERR");
        tax.TouristTax.Should().Be(-1m);
        tax.TouristTaxPP.Should().Be(-1m);
        // Currency is not exposed; only amounts are validated.
    }
}
