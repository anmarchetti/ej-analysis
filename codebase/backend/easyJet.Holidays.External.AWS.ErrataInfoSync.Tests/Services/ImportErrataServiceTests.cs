using easyJet.Holidays.Api.Domain.Data.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Services;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Tests.Services;

public class ImportErrataServiceTests
{
    // base
    private readonly Mock<IDestinationsService> _destinationsService;
    private readonly Mock<IErrataInfoService> _errataInfoService;

    // concrete
    private readonly Mock<IReferenceDataProvider> _referenceDataService;
    private readonly AtcomDbSettings _atcomDbSettings;


    private readonly ImportErrataService _sut;

    public ImportErrataServiceTests()
    {
        _destinationsService = new();
        _errataInfoService = new();
        _referenceDataService = new();

        _atcomDbSettings = new() { ConnectionString = "someTestConnection" };

        _sut = new(
            _referenceDataService.Object,
            _destinationsService.Object,
            _errataInfoService.Object,
            new Mock<ILogger<ImportErrataService>>().Object,
            Options.Create(_atcomDbSettings)
        );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public async Task GetErrataInfo_OnMissingConnectionString_ReturnsNull(string invalidInput)
    {
        // Arrange
        _atcomDbSettings.ConnectionString = invalidInput;

        // Act
        var result = await _sut.GetErrataInfo();

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task ConvertGeographyToAirportCodes_ConvertsCorrectly()
    {
        // Arrange
        _referenceDataService.Setup(mock => mock.GetAllDestinations(It.IsAny<bool>(), It.IsAny<string>())).ReturnsAsync([
            new(){Code = "firstDestination",AirportCodes = ["someAirport", "anotherOne"]}
            ]);

        var input = new List<AtcomErrataModel>()
        {
            new (){Code = "firstDestination", ErrataCode = ErrataTypes.Geography}, // processed further
            new (){Code = "anotherCode", ErrataCode = ErrataTypes.Accommodation} // not processed
        };

        // Act
        var result = await _sut.ConvertGeographyToAirportCodes(input);

        // Assert
        result.Should().NotBeNull();
    }
}