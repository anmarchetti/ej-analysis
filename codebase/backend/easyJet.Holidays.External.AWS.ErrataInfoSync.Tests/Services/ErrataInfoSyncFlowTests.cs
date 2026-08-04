using easyJet.Holidays.Api.Domain.Data.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Services;
using Microsoft.Extensions.Logging;
using Moq;
using System.Data;
using System.Text.RegularExpressions;
using Xunit;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Tests.Services;

public class ErrataInfoSyncFlowTests
{
    private readonly Mock<IImportErrataService> _importErrataService;
    private readonly Mock<IErrataInfoService> _errataInfoService;
    private readonly Mock<IImportFlightErrataService> _importFlightErrataService;

    private readonly ErrataInfoSyncFlow _sut;

    public ErrataInfoSyncFlowTests()
    {
        _importErrataService = new();
        _errataInfoService = new();
        _importFlightErrataService = new();
        Mock<ILogger<ErrataInfoSyncFlow>> logger = new();

        _sut = new(
            _importErrataService.Object,
            _errataInfoService.Object,
            _importFlightErrataService.Object,
            logger.Object
        );
    }

    [Fact]
    public async Task SaveErrata_GetErrataFromAccom_SaveToDB()
    {
        List<HotelErrataModel> errataInfo = new List<HotelErrataModel>()
        {
            new HotelErrataModel()
            {
                HotelCode = "HOTELCODE",
                ErratasInfo = new List<ErrataInfoModel>()
                {
                    new ErrataInfoModel()
                    {
                        DepartureEndDate = new DateTime(),
                        DepartureStartDate = new DateTime(),
                        Errata = "My test errata",
                        ErrataCode = ErrataTypes.Accommodation
                    }
                }
            }
        };

        _errataInfoService.Setup(x => x.DeleteOldErrata()).Returns(Task.CompletedTask);
        _importErrataService
            .Setup(x => x.GetErrataInfo())
            .ReturnsAsync(errataInfo);

        // Act
        await _sut.SaveErrata();

        _errataInfoService.Verify(m => m.DeleteOldErrata(), Times.Once);
        _importErrataService.Verify(m => m.GetErrataInfo(), Times.Once);
        _errataInfoService.Verify(m => m.Save(It.Is<List<HotelErrataModel>>(x => x[0].HotelCode == "HOTELCODE")), Times.Once);
    }

    [Fact]
    public async Task SaveFlightErrata_SuccessfullyPasses()
    {
        // Arrange
        var errataInfo = new List<FlightErrataModel>()
        {
            new FlightErrataModel()
        };

        _importFlightErrataService.Setup(
            mock =>
                mock.GetFlightErrataInfo()
        ).ReturnsAsync(errataInfo);

        _errataInfoService.Setup(mock => mock.DeleteOldFlightErrata()).Returns(Task.CompletedTask);
        _errataInfoService.Setup(mock => mock.SaveFlightErrata(errataInfo)).Returns(Task.CompletedTask);

        // Act
        await _sut.SaveFlightErrata();

        // Assert
        _importFlightErrataService.Verify(mock => mock.GetFlightErrataInfo(), Times.Once);
        _errataInfoService.Verify(mock => mock.DeleteOldFlightErrata(), Times.Once);
        _errataInfoService.Verify(mock => mock.SaveFlightErrata(errataInfo), Times.Once);
    }

    [Fact]
    public async Task SaveFlightErrata_NoInfo_ProceedsWithoutSync()
    {
        // Arrange
        List<FlightErrataModel> info = null;

        _importFlightErrataService.Setup(
            mock =>
                mock.GetFlightErrataInfo()
        ).ReturnsAsync(info);

        // Act
        await _sut.SaveFlightErrata();

        // Assert
        _importFlightErrataService.Verify(mock => mock.GetFlightErrataInfo(), Times.Once);
        // if the returned info is null, then there is no need for syncing
        _errataInfoService.Verify(mock => mock.DeleteOldFlightErrata(), Times.Never);
        _errataInfoService.Verify(mock => mock.SaveFlightErrata(It.IsAny<List<FlightErrataModel>>()), Times.Never);
    }

    [Fact]
    public async Task Sync_TriggersBoth()
    {
        // Arrange
        _importErrataService.Setup(mock => mock.GetErrataInfo()).ReturnsAsync(null as List<HotelErrataModel>);
        _importFlightErrataService.Setup(mock => mock.GetFlightErrataInfo()).ReturnsAsync(null as List<FlightErrataModel>);

        // Act
        await _sut.Sync();

        // Assert
        _errataInfoService.VerifyNoOtherCalls();
    }
}