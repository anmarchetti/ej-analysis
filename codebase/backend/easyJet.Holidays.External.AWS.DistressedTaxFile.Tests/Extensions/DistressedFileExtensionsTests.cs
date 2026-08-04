using easyJet.Holidays.External.AWS.DistressedTaxFile.Extensions;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Models;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Tests.Extensions;

public class DistressedFileExtensionsTests
{
    [Fact]
    public void AddTaxes_TestData_CorrectResult()
    {
        //Arrange
        var departureAirportsChildTaxFree = $"ABZ,BFS,BHX,BRS,EDI,GLA,IOM,LPL,LGW,LTN,SEN,MAN,NCL".Split(",", StringSplitOptions.RemoveEmptyEntries);

        var distressedFile = new List<DistressedOutputDataRow>()
        {
            new()
            {
                DepartureAirport = "AGP",
                ArrivalAirport = "BER",
                Currency = "GBP",

            },
            new()
            {
                DepartureAirport = "BDS",
                ArrivalAirport = "MXP",
                Currency = "GBP",
            },
            new()
            {
                DepartureAirport = "BFS",
                ArrivalAirport = "BHX",
                Currency = "GBP",
            },
            new()
            {
                DepartureAirport = "BFS",
                ArrivalAirport = "BHX",
                Currency = "CHF",
            },
            //no match in the tax file
            new()
            {
                DepartureAirport = "TEST",
                ArrivalAirport = "TEST",
                Currency = "GBP",
            }
        };

        var taxFile = new List<TaxDataRow>()
        {
            new()
            {
                Sector = "AGPBER",
                GBP = 0,
            },
            new TaxDataRow()
            {
                Sector = "BDSMXP",
                GBP = 5.81M,
            },
            new TaxDataRow()
            {
                Sector = "BFSBHX",
                GBP = 13M,
                CHF = 15M,
            },
        };

        var expectedResults = new List<DistressedOutputDataRowWithTaxes>()
        {
            new()
            {
                //Sector = "AGPBER",
                DepartureAirport = "AGP",
                ArrivalAirport = "BER",
                AdultTax = "0.00",
                ChildTax = "0.00",
                Currency = "GBP",
            },
            new()
            {
                //Sector = "BDSMXP",
                DepartureAirport = "BDS",
                ArrivalAirport = "MXP",
                AdultTax = "5.81",
                ChildTax = "5.81",
                Currency = "GBP",
            },
            new()
            {
                //Sector = "BFSBHX",
                DepartureAirport = "BFS",
                ArrivalAirport = "BHX",
                AdultTax = "13.00",
                ChildTax = "0.00",
                Currency = "GBP",
            },
            new()
            {
                //Sector = "BFSBHX",
                DepartureAirport = "BFS",
                ArrivalAirport = "BHX",
                AdultTax = "15.00",
                ChildTax = "0.00",
                Currency = "CHF",
            },
            new()
            {
                //Sector = "TESTTEST",
                DepartureAirport = "TEST",
                ArrivalAirport = "TEST",
                AdultTax = "0.00",
                ChildTax = "0.00",
                Currency = "GBP",
            }
        };

        //Act
        var distressedFileWithTaxes = distressedFile.AddTaxes(taxFile, departureAirportsChildTaxFree);

        //Assert
        distressedFileWithTaxes.Should().BeEquivalentTo(expectedResults);
    }
}