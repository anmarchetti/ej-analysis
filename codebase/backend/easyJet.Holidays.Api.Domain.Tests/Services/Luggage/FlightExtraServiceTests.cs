using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Luggage;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Luggage;

public class FlightExtraServiceTests
{
    private readonly Mock<IFlightExtraCacheService> _flightExtrasCacheMock = new();
    private readonly Mock<IFlightExtraSearchService> _flightExtraSearchMock = new();
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock = new();
    private readonly IFlightExtraService _flightExtraService;

    public FlightExtraServiceTests()
    {
        _flightExtraService = new FlightExtraService(
            _flightExtraSearchMock.Object,
            _referenceDataServiceMock.Object,
            _flightExtrasCacheMock.Object
        );
    }

    [Fact]
    public async Task GetFlightExtras_WhenCalled_ShouldReturnFlightExtrasFromCache()
    {
        // Arrange
        var route = new Route
        {
            RouteId = "Route1",
            FltNo = "FN123",
            DepPt = "JFK",
            ArrPt = "LHR",
            DepDate = DateTime.UtcNow
        };
        var offer = new Offer { Transport = new Transport { Routes = new List<Route> { route } } };
        var guests = new List<Person> { new() { Type = PersonType.Adult } };
        var cachedFlightExtras = new List<FlightExtraCategoryList>();

        _flightExtrasCacheMock
            .Setup(c => c.GetFlightExtras(
                It.IsAny<FlightId[]>(),
                It.IsAny<Func<Task<IList<FlightExtraCategoryList>>>>(),
                It.IsAny<bool>())
            )
            .ReturnsAsync(cachedFlightExtras);

        // Act
        var extras = await _flightExtraService.GetFlightExtras(offer, guests);

        // Assert
        extras.Should().BeSameAs(cachedFlightExtras);
    }

    [Fact]
    public async Task GetFlightExtras_WhenCacheMiss_ShouldCallFetchFunction()
    {
        // Arrange
        var route = new Route
        {
            RouteId = "Route1",
            FltNo = "FN123",
            DepPt = "JFK",
            ArrPt = "LHR",
            DepDate = DateTime.UtcNow
        };
        var offer = new Offer { Transport = new Transport { Routes = new List<Route> { route } } };
        var guests = new List<Person> { new() { Type = PersonType.Adult } };
        var fetchedFlightExtras = new List<FlightExtraCategoryList>();

        _flightExtrasCacheMock
            .Setup(c => c.GetFlightExtras(
                It.IsAny<FlightId[]>(),
                It.IsAny<Func<Task<IList<FlightExtraCategoryList>>>>(),
                It.IsAny<bool>())
            )
            .Returns((FlightId[] _, Func<Task<IList<FlightExtraCategoryList>>> fetchFunc, bool _) => fetchFunc());

        _flightExtraSearchMock
            .Setup(s => s.GetFlightExtras(offer, guests, false))
            .ReturnsAsync(fetchedFlightExtras);

        // Act
        var result = await _flightExtraService.GetFlightExtras(offer, guests);

        // Assert
        result.Should().BeSameAs(fetchedFlightExtras);
        _flightExtraSearchMock.Verify(s => s.GetFlightExtras(offer, guests, false), Times.Once);
    }

    [Fact]
    public async Task GetFlightExtras_WhenCacheHit_ShouldNotCallFetchFunction()
    {
        // Arrange
        var route = new Route
        {
            RouteId = "1",
            FltNo = "FN123",
            DepPt = "JFK",
            ArrPt = "LHR",
            DepDate = DateTime.Now
        };
        var offer = new Offer { Transport = new Transport { Routes = new List<Route> { route } } };
        var guests = new List<Person> { new() { Type = PersonType.Adult } };
        var cachedFlightExtras = new List<FlightExtraCategoryList> { new() { RouteId = "1" } };

        _flightExtrasCacheMock
            .Setup(c => c.GetFlightExtras(
                It.IsAny<FlightId[]>(),
                It.IsAny<Func<Task<IList<FlightExtraCategoryList>>>>(),
                It.IsAny<bool>())
            )
            .ReturnsAsync(cachedFlightExtras);

        // Act
        var result = await _flightExtraService.GetFlightExtras(offer, guests);

        // Assert
        result.Should().BeSameAs(cachedFlightExtras);

        _flightExtraSearchMock.Verify(
            s => s.GetFlightExtras(
                It.IsAny<Offer>(),
                It.IsAny<IEnumerable<Person>>(),
                It.IsAny<bool>()
            ),
            Times.Never
        );
    }
}