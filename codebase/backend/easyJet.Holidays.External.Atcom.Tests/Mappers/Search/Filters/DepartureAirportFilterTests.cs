using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xunit;
using Airport = easyJet.Holidays.Api.Domain.Data.ReferenceData.Airport;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;
public class DepartureAirportFilterTests
{
    private readonly IOptions<AtcomSettings> _atcomSettings;
    private readonly Mock<IRouteAvailabilityService> _routeAvailabilityServiceMock;
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock;
    private readonly Mock<IMarketService> _marketServiceMock;

    public DepartureAirportFilterTests()
    {
        _atcomSettings = Options.Create(new AtcomSettings { AnywhereCode = "ALL" });
        _routeAvailabilityServiceMock = new Mock<IRouteAvailabilityService>();
        _referenceDataServiceMock = new Mock<IReferenceDataService>();
        _marketServiceMock = new Mock<IMarketService>();
    }

    private DepartureAirportFilter CreateFilter() => new DepartureAirportFilter(
        _atcomSettings,
        _routeAvailabilityServiceMock.Object,
        _referenceDataServiceMock.Object,
        _marketServiceMock.Object);

    [Theory]
    [InlineData("ES,ESTF", "ESTF")] 
    [InlineData("GB,GBNI,GBNIDE", "GBNIDE")] 
    [InlineData("PL|SI|AT|CH,PLKR|SILJ|ATAT|CHZU", "PLKR,SILJ,ATAT,CHZU")]
    [InlineData("MT|PL|ES|GB,MTMT|PLKR|GBNI|ESIB|ESMN|ESMJ,GBNIDE|GBNICO", "MTMT,PLKR,GBNIDE,GBNICO,ESIB,ESMN,ESMJ")]
    public void ParseGeographyField_ShouldReturnCorrectlyParsedGeography(string geographyInput, string expectedOutput)
    {
        // Act
        var result = DepartureAirportFilter.ParseGeographyField(geographyInput);

        // Assert
        result.Should().Be(expectedOutput);
    }

    [Fact]
    public async Task GetOptions_ShouldMapTrackingIdFromAirportReferenceData()
    {
        // Arrange
        _routeAvailabilityServiceMock
            .Setup(x => x.GetDepartureAvailability(
                It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<int?>(), It.IsAny<string>()))
            .ReturnsAsync(new[] { "LGW" });

        _referenceDataServiceMock
            .Setup(x => x.GetAirports())
            .ReturnsAsync(new Dictionary<string, Airport>
            {
                ["LGW"] = new Airport { Name = "London Gatwick", TrackingId = "tracking-lgw" },
                ["LTN"] = new Airport { Name = "London Luton", TrackingId = "tracking-ltn" }
            });

        var sut = CreateFilter();
        var request = new PackagesSearchRequest
        {
            Departure = "LGW,LTN",
            Geography = "ES",
            StartDate = "2025-01-01",
            Duration = new List<int> { 7 }
        };

        // Act
        var result = await sut.GetOptions(
            new List<AvCacheResultOffersOfferExtended>(),
            request,
            (offers, req) => Task.FromResult(offers));

        // Assert
        result.Options.Should().HaveCount(2);
        result.Options.Single(o => o.Code == "LGW").TrackingId.Should().Be("tracking-lgw");
        result.Options.Single(o => o.Code == "LTN").TrackingId.Should().Be("tracking-ltn");
    }

    [Fact]
    public async Task GetOptions_ShouldMapNullTrackingId_WhenAirportNotFoundInReferenceData()
    {
        // Arrange
        _routeAvailabilityServiceMock
            .Setup(x => x.GetDepartureAvailability(
                It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<int?>(), It.IsAny<string>()))
            .ReturnsAsync(Array.Empty<string>());

        _referenceDataServiceMock
            .Setup(x => x.GetAirports())
            .ReturnsAsync(new Dictionary<string, Airport>());

        var sut = CreateFilter();
        var request = new PackagesSearchRequest
        {
            Departure = "LGW",
            Geography = "ES",
            StartDate = "2025-01-01",
            Duration = new List<int> { 7 }
        };

        // Act
        var result = await sut.GetOptions(
            new List<AvCacheResultOffersOfferExtended>(),
            request,
            (offers, req) => Task.FromResult(offers));

        // Assert
        result.Options.Should().ContainSingle();
        var option = result.Options.Single();
        option.Code.Should().Be("LGW");
        option.TrackingId.Should().BeNull();
        option.Name.Should().BeNull();
    }
}
