using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;
using easyJet.Holidays.External.AWS.FPSExport.Service;
using easyJet.Holidays.External.AWS.FPSExport.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.FPSExport.Tests.Services;

public class FpsSelectorServiceTests
{
    private readonly LambdaSettings _settings;

    private readonly FpsSelectorService _sut;

    public FpsSelectorServiceTests()
    {
        _settings = new LambdaSettings()
        {
            NewFareClassPhaseOneEnabled = false, // default
            MinimumDiscountedAvailabilityThreshold = 4
        };

        _sut = new FpsSelectorService(Options.Create(_settings));
    }

    [Fact]
    public void SelectFare_InLegacyMode_AppliesLegacyFilteringLogic()
    {
        // Arrange
        var standardFareId = Guid.NewGuid().ToString("N");
        var discountedFareId = Guid.NewGuid().ToString("N");
        var inputData = new List<FlightPriceStoreModel>()
        {
            new()
            {
                ID = discountedFareId,
                FareType = FareType.HolidaysDiscounted.GetKnownFareType(),
                InboundAdultFlightPrice = 100d,
                OutboundAdultFlightPrice = 100d,
                InboundChildFlightPrice = 95d,
                OutboundChildFlightPrice = 95d,
            },
            new()
            {
                ID = standardFareId,
                FareType = FareType.Standard.GetKnownFareType(),
                InboundAdultFlightPrice = 200d,
                OutboundAdultFlightPrice = 200d,
                InboundChildFlightPrice = 190d,
                OutboundChildFlightPrice = 190d,
            }
        };

        // Act
        var result = _sut.SelectFare(inputData);

        // Assert
        result.Should().NotBeNullOrEmpty();
        result.Should().NotContain(record => record.ID == discountedFareId, "legacy selector only considers standard fares");
        result.Should().Contain(record => record.ID == standardFareId, "legacy selector only considers standard fares");
    }

    [Fact]
    public void SelectFare_CorrectlyAppliesDateAndAirportFilters()
    {
        // Arrange
        _settings.IgnoreDepartureAirports = "ABC,DEF";
        _settings.IgnoreDepartureDateTo = DateTime.UtcNow.AddMonths(-6);

        var inputData = new List<FlightPriceStoreModel>()
        {
            new(){FareType = FareType.Standard.GetKnownFareType(), Departure = "ABC", LocalDepartureDateTime = DateTime.UtcNow.AddMonths(-7)}, // to be filtered out 
            new(){FareType = FareType.Standard.GetKnownFareType(), Departure = "ABC", LocalDepartureDateTime = DateTime.UtcNow.AddMonths(6)}, // only matches airport
            new(){FareType = FareType.Standard.GetKnownFareType(), Departure = "DEF", LocalDepartureDateTime = DateTime.UtcNow.AddMonths(6)}, // only matches airport
            new(){FareType = FareType.Standard.GetKnownFareType(), Departure = "LTN", LocalDepartureDateTime = DateTime.UtcNow.AddMonths(-7)}, // only matches time
            new(){FareType = FareType.Standard.GetKnownFareType(), Departure = "LTN", LocalDepartureDateTime = DateTime.UtcNow.AddMonths(6)} // doesn't match either
        };

        // Act
        var result = _sut.SelectFare(inputData);

        // Assert
        result.Should().NotBeNullOrEmpty();
        result.Count.Should().Be(inputData.Count - 1);
    }

    [Fact]
    public void SelectFare_InPhaseOne_AppliesFareTypeSensitiveLogic()
    {
        // Arrange
        _settings.NewFareClassPhaseOneEnabled = true;

        var inputData = new List<FlightPriceStoreModel>();

        const string flightWithNoDiscountedFares = "A";
        var noDiscountedFares = new List<FlightPriceStoreModel>()
        {
            new()
            {
                FlightKey = flightWithNoDiscountedFares,
                FareType = FareType.Standard.GetKnownFareType(),
                OutboundAdultFlightPrice = 100d,
                InboundAdultFlightPrice = 100d,
                Currency = "GBP"
            },
            new()
            {
                FlightKey = flightWithNoDiscountedFares,
                FareType = FareType.Standard.GetKnownFareType(),
                OutboundAdultFlightPrice = 115d,
                InboundAdultFlightPrice = 115d,
                Currency = "EUR"
            }
        };
        inputData.AddRange(noDiscountedFares);

        const string flightWithUnavailableDiscountedFares = "B";
        const double gbpExpectedForUnavailableDiscounted = 200d;
        const double eurExpectedForUnavailableDiscounted = 230d;
        var unavailableDiscountedFares = new List<FlightPriceStoreModel>()
        {
            new()
            {
                FlightKey = flightWithUnavailableDiscountedFares,
                FareType = FareType.HolidaysDiscounted.GetKnownFareType(),
                AvailableInventory = _settings.MinimumDiscountedAvailabilityThreshold - 2,
                OutboundAdultFlightPrice = 100d,
                InboundAdultFlightPrice = 100d,
                Currency = "GBP"
            },
            new()
            {
                FlightKey = flightWithUnavailableDiscountedFares,
                FareType = FareType.HolidaysDiscounted.GetKnownFareType(),
                AvailableInventory = _settings.MinimumDiscountedAvailabilityThreshold - 2,
                OutboundAdultFlightPrice = 115d,
                InboundAdultFlightPrice = 115d,
                Currency = "EUR"
            },
            new()
            {
                FlightKey = flightWithUnavailableDiscountedFares,
                FareType = FareType.Standard.GetKnownFareType(),
                OutboundAdultFlightPrice = gbpExpectedForUnavailableDiscounted,
                InboundAdultFlightPrice = gbpExpectedForUnavailableDiscounted,
                Currency = "GBP"
            },
            new()
            {
                FlightKey = flightWithUnavailableDiscountedFares,
                FareType = FareType.Standard.GetKnownFareType(),
                OutboundAdultFlightPrice = eurExpectedForUnavailableDiscounted,
                InboundAdultFlightPrice = eurExpectedForUnavailableDiscounted,
                Currency = "EUR"
            }
        };
        inputData.AddRange(unavailableDiscountedFares);

        const string flightWithAvailableDiscountedFares = "C";
        const double gbpExpectedForAvailableDiscounted = 100d;
        const double eurExpectedForAvailableDiscounted = 115d;
        var availableDiscountedFares = new List<FlightPriceStoreModel>()
        {
            new()
            {
                FlightKey = flightWithAvailableDiscountedFares,
                FareType = FareType.HolidaysDiscounted.GetKnownFareType(),
                AvailableInventory = _settings.MinimumDiscountedAvailabilityThreshold + 2,
                OutboundAdultFlightPrice = gbpExpectedForAvailableDiscounted,
                InboundAdultFlightPrice = gbpExpectedForAvailableDiscounted,
                Currency = "GBP"
            },
            new()
            {
                FlightKey = flightWithAvailableDiscountedFares,
                FareType = FareType.HolidaysDiscounted.GetKnownFareType(),
                AvailableInventory = _settings.MinimumDiscountedAvailabilityThreshold + 2,
                OutboundAdultFlightPrice = eurExpectedForAvailableDiscounted,
                InboundAdultFlightPrice = eurExpectedForAvailableDiscounted,
                Currency = "EUR"
            },
            new()
            {
                FlightKey = flightWithAvailableDiscountedFares,
                FareType = FareType.Standard.GetKnownFareType(),
                OutboundAdultFlightPrice = gbpExpectedForAvailableDiscounted * 2,
                InboundAdultFlightPrice = gbpExpectedForAvailableDiscounted * 2,
                Currency = "GBP"
            },
            new()
            {
                FlightKey = flightWithAvailableDiscountedFares,
                FareType = FareType.Standard.GetKnownFareType(),
                OutboundAdultFlightPrice = eurExpectedForAvailableDiscounted * 2,
                InboundAdultFlightPrice = eurExpectedForAvailableDiscounted * 2,
                Currency = "EUR"
            }
        };
        inputData.AddRange(availableDiscountedFares);

        // Act
        var result = _sut.SelectFare(inputData);

        // Assert
        result.Should().NotBeNullOrEmpty();

        // there's only standard fares available for this flight. they need to be included.
        result.Should().Contain(
            element => 
                element.FlightKey == flightWithNoDiscountedFares &&
                element.GetKnownFareType() == FareType.Standard
        );

        // discounted fares are present, but their availability is below the threshold.
        result.Should().Contain(
            element =>
                element.FlightKey == flightWithUnavailableDiscountedFares &&
                element.GetKnownFareType() == FareType.Standard
        );

        // we need to include standard fares instead.
        result.Should().NotContain(
            element =>
                element.FlightKey == flightWithUnavailableDiscountedFares &&
                element.GetKnownFareType() == FareType.HolidaysDiscounted
        );

        // discounted fares are available and there is enough inventory available
        result.Should().Contain(
            element =>
                element.FlightKey == flightWithAvailableDiscountedFares &&
                element.GetKnownFareType() == FareType.HolidaysDiscounted
        );

        // that means, we won't include the standard fare.
        result.Should().NotContain(
            element =>
                element.FlightKey == flightWithAvailableDiscountedFares &&
                element.GetKnownFareType() == FareType.Standard
        );

        result.Count.Should().Be(6, "three flight keys with two currencies each");
    }
}