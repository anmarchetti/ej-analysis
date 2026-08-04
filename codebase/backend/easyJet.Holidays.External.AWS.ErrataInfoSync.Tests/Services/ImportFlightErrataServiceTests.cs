using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Services;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Data;
using System.Text.RegularExpressions;
using Xunit;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Tests.Services;

public class ImportFlightErrataServiceTests
{
    // base
    private readonly Mock<IDestinationsService> _destinationsService;
    private readonly Mock<IErrataInfoService> _errataInfoService;

    // concrete
    private readonly Mock<IAtcomErrataOracleService> _atcomFlightErrataOracleService;
    private readonly LambdaSettings _settings;

    private readonly ImportFlightErrataService _sut;

    public ImportFlightErrataServiceTests()
    {
        _destinationsService = new();
        _errataInfoService = new();
        Mock<ILogger<ImportFlightErrataService>> logger = new();
        _atcomFlightErrataOracleService = new();
        _settings = new LambdaSettings() { FailOnEmptyErrata = false };

        _sut = new(
            _destinationsService.Object,
            _errataInfoService.Object,
            _atcomFlightErrataOracleService.Object,
            logger.Object,
            Options.Create(_settings)
        );
    }

    [Fact]
    public async Task GetFlightErrata_WhenResultSetIsEmpty_And_ToggleIsSet_Throws()
    {
        // Arrange
        _settings.FailOnEmptyErrata = true;
        _atcomFlightErrataOracleService.Setup(mock => mock.GetAtcomDataTable()).Returns(new DataTable());

        // Act
        var action = async () => await _sut.GetFlightErrataInfo();

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetFlightErrata_WhenResultSetIsEmpty_And_ToggleIsUnset_ReturnsEmptySet()
    {
        // Arrange
        _settings.FailOnEmptyErrata = false;
        _atcomFlightErrataOracleService.Setup(mock => mock.GetAtcomDataTable()).Returns(new DataTable());

        // Act
        var result = await _sut.GetFlightErrataInfo();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetFlightErrata_GetFlightErrataFromAccom()
    {
        // Arrange
        _destinationsService.Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
            .ReturnsAsync(new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.Country,
                    Code = "GB",
                    Name = "United Kingdom",
                    Parents = null,
                    Available = true,
                    AirportCodes = new[]
                    {
                        "JER",
                        "LGW",
                        "LTN",
                        "STN",
                        "BFS",
                        "BHD",
                        "EDI",
                        "GLA"
                    },
                    Children = null,
                    ShowOnSearchPod = true,
                    GiataCode = null,
                    RelatedRegions = null,
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Country,
                    Code = "CY",
                    Name = "Cyprus",
                    Parents = null,
                    Available = true,
                    AirportCodes = new[]
                    {
                        "LCA",
                        "PFO"
                    },
                    Children = null,
                    ShowOnSearchPod = true,
                    GiataCode = null,
                    RelatedRegions = null,
                }
            }.ToArray());


        var dataTable = EnrichFlightErrataData();
        _errataInfoService.Setup(x => x.DeleteOldErrata()).Returns(Task.CompletedTask);
        _errataInfoService.Setup(x => x.GenerateFlightErrataCode(It.IsAny<string>(), It.IsAny<string>())).Returns(
            (string departurePoint, string arrivalPoint) =>
                $"{(string.IsNullOrEmpty(departurePoint) ? "ALL" : departurePoint)}-{(string.IsNullOrEmpty(arrivalPoint) ? "ALL" : arrivalPoint)}");
        _errataInfoService.Setup(x => x.MapLanguageCode(It.IsAny<string>())).Returns(new[] { "en" });

        _atcomFlightErrataOracleService.Setup(mock => mock.GetAtcomDataTable()).Returns(dataTable);

        // Act
        var result = await _sut.GetFlightErrataInfo();

        // Assert
        result.Should().HaveCount(82);
    }


    private readonly List<string> _flightErrataColumnHeaders =
    [
        "ATTRIBUTE_CD",
        "ATTRIBUTE_NAME",
        "TRANS_ERRATA_ID",
        "EFF_DT",
        "DEPARTUREPOINT",
        "DEPARTUREPOINTNAME",
        "DEPARTUREPOINTTYPE",
        "ARRIVALPOINT",
        "ARRIVALPOINTNAME",
        "ARRIVALPOINTTYPE",
        "ATT_NOTE_TEXT",
        "LANG_CD",
        "TEXT",
        "FLIGHTNUMBER",
        "DEP_FROM_DT",
        "DEP_TO_DT",
        "BK_FROM_DT",
        "BK_TO_DT",
        "CARRIERCODE",
        "INV_TP",
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT",
        "SUN",
        "DIR_MTH",
        "TRANSCODE"
    ];

    //16 dataSets
    private const string FakeErrata1 = "FE1|Flight Errata|2185821507|01-MAR-22|GB|United Kingdom|CTY1|CY|Cyprus|CTY1|Errata|01-MAR-22|20-MAR-22|EN|Hello There I m some flight errata and I am hoping this will populate OK and that I can check the XML to find out if I a different to accommodation errata!!<br /><br />Have a great Holiday and I am really jealous and hope you pool is closed ad that you don't get any free drinks!!<br /><br />||01-MAR-22|31-DEC-22|01-MAR-22|31-DEC-22|EZY|ALL|Y|N|Y|Y|Y|Y|Y|IN|";

    //16 dataSets
    private const string FakeErrata2 = "FE1|Flight Errata|2185821510||GB|United Kingdom|CTY1|CY|Cyprus|CTY1||01-MAR-22|20-MAR-22|EN|Row2||01-MAR-22|31-DEC-22|01-MAR-22|31-DEC-22|EZY|ALL|Y|Y|Y|Y|Y|Y|Y|ALL|";

    //64 dataSets
    private const string FakeErrata3 = "FE1|Flight Errata|2185821507|01-MAR-22|GB|United Kingdom|CTY1|GB|United Kingdom|CTY1|Errata|01-MAR-22|20-MAR-22|EN|Row 3 Hello There I m some flight errata and I am hoping this will populate OK and that I can check the XML to find out if I a different to accommodation errata!!<br /><br />Have a great Holiday and I am really jealous and hope you pool is closed ad that you don't get any free drinks!!<br /><br />||01-MAR-22|31-DEC-22|01-MAR-22|31-DEC-22|EZY|ALL|Y|Y|Y|Y|Y|Y|Y|EX|";

    //1 because have flightNumber
    private const string FakeErrata4 = "FE1|Flight Errata|2185821507|01-MAR-22|GB|United Kingdom|CTY1|JER|United Kingdom|AIR|Errata|01-MAR-22|20-MAR-22|EN|Row 4 Hello There I m some flight errata and I am hoping this will populate OK and that I can check the XML to find out if I a different to accommodation errata!!<br /><br />Have a great Holiday and I am really jealous and hope you pool is closed ad that you don't get any free drinks!!<br /><br />|FLIGHTNUMBER|01-MAR-22|31-DEC-22|01-MAR-22|31-DEC-22|EZY|ALL|Y|Y|Y|Y|Y|Y|Y|ALL|";

    //1 dataSet
    private const string FakeErrata5 = "FE1|Flight Errata|2185821507|01-MAR-22|MAH|United Kingdom|AIR|JER|United Kingdom|AIR|Errata|01-MAR-22|20-MAR-22|EN|Row 5 Hello There I m some flight errata and I am hoping this will populate OK and that I can check the XML to find out if I a different to accommodation errata!!<br /><br />Have a great Holiday and I am really jealous and hope you pool is closed ad that you don't get any free drinks!!<br /><br />||01-MAR-22|31-DEC-22|01-MAR-22|31-DEC-22|EZY|ALL|Y|Y|Y|Y|Y|Y|Y|ALL|";

    private readonly List<string> _flightErrataDataRows =
    [
        FakeErrata1,
        FakeErrata2,
        FakeErrata3,
        FakeErrata4,
        FakeErrata5
    ];

    private readonly Regex _exRegex = new Regex("([0-9]{2})-([a-zA-Z]{3})-([0-9]{2})");

    private DataTable EnrichFlightErrataData()
    {
        var dataTable = new DataTable();

        foreach (var flightErrataColumnHeader in _flightErrataColumnHeaders)
        {
            dataTable.Columns.Add(flightErrataColumnHeader);
        }

        foreach (var flightErrataDataRow in _flightErrataDataRows)
        {
            var row = dataTable.NewRow();
            row.BeginEdit();
            var flightErrataData = flightErrataDataRow.Split("|").Select(i => string.IsNullOrEmpty(i) ? null : i)
                .ToList();

            for (var j = 0; j < dataTable.Columns.Count; j++)
            {
                var value = flightErrataData[j];
                if (value == null)
                {
                    row[j] = value;
                }
                else if (_exRegex.IsMatch(value))
                {
                    row[j] = DateTime.Parse(value);
                }
                else
                {
                    row[j] = value;
                }
            }

            row.EndEdit();

            dataTable.Rows.Add(row);
        }

        return dataTable;
    }
}