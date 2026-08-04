using easyJet.Holidays.Api.Domain.Data.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Services;

/// <inheritdoc cref="IErrataInfoSyncFlow"/> />
public class ErrataInfoSyncFlow : IErrataInfoSyncFlow
{
    private readonly IImportErrataService _importErrataService;
    private readonly IErrataInfoService _errataInfoService;
    private readonly IImportFlightErrataService _importFlightErrataService;
    private readonly ILogger<ErrataInfoSyncFlow> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="importErrataService"></param>
    /// <param name="errataInfoService"></param>
    /// <param name="importFlightErrataService"></param>
    /// <param name="logger"></param>
    public ErrataInfoSyncFlow(
        IImportErrataService importErrataService,
        IErrataInfoService errataInfoService,
        IImportFlightErrataService importFlightErrataService,
        ILogger<ErrataInfoSyncFlow> logger)
    {
        _importErrataService = importErrataService;
        _errataInfoService = errataInfoService;
        _importFlightErrataService = importFlightErrataService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task Sync()
    {
        await SaveErrata();
        await SaveFlightErrata();
    }

    internal async Task SaveErrata()
    {
        _logger.LogInformation("Errata sync is started");

        List<HotelErrataModel> errataInfo = await _importErrataService.GetErrataInfo();

        if (errataInfo != null)
        {
            await _errataInfoService.DeleteOldErrata();

            _logger.LogInformation("Errata saving is started");

            await _errataInfoService.Save(errataInfo);
        }

        _logger.LogInformation("Errata sync is finished");
    }

    internal async Task SaveFlightErrata()
    {
        _logger.LogInformation("Flight Errata sync is started");

        var errataInfo = await _importFlightErrataService.GetFlightErrataInfo();

        if (errataInfo != null)
        {
            await _errataInfoService.DeleteOldFlightErrata();


            _logger.LogInformation("Flight Errata saving is started");
            await _errataInfoService.SaveFlightErrata(errataInfo);
        }

        _logger.LogInformation("Flight Errata sync is finished");
    }
}