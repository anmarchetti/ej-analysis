using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Interfaces;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Models;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Adapter;

/// <inheritdoc />
internal sealed class BoardUpgradeEskelAdapter : IBoardUpgradeEskelAdapter
{
    private readonly IApiService _apiService;
    private readonly ILogger<BoardUpgradeEskelAdapter> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// Initializes a new instance of the <see cref="BoardUpgradeEskelAdapter"/> class.
    /// </summary>
    /// <param name="apiService">The API service for making HTTP requests.</param>
    /// <param name="lambdaOptions">The configuration settings for Eskel endpoints.</param>
    /// <param name="logger">The logger for logging messages.</param>
    public BoardUpgradeEskelAdapter([FromKeyedServices("EskelApi")]IApiService apiService, ILogger<BoardUpgradeEskelAdapter> logger, IOptions<LambdaSettings> lambdaOptions)
    {
        _apiService = apiService;
        _logger = logger;
        _lambdaSettings = lambdaOptions.Value;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<BoardUpgradeModel>> GetAll()
    {
        try
        {
            var eskelUri = _lambdaSettings.EskelUri;
            var timeout = _lambdaSettings.EskelRequestTimeoutInSeconds is not default(int)
                ? TimeSpan.FromSeconds(_lambdaSettings.EskelRequestTimeoutInSeconds)
                : default(TimeSpan?);

            var boardRequest = new BoardUpgradeRequest(timeout)
            {
                Endpoint = eskelUri
            };

            var responseContentAsync =
                await _apiService.GetResponseContentAsync<BoardUpgradeRequest, BoardUpgradeResponse>(boardRequest);

            return responseContentAsync?.Payload?.Body;
        }
        catch (Exception exc)
        {
            _logger.LogError(exc, "Failed to get board upgrade information from Eskel system");
            throw new InvalidOperationException("Failed to retrieve from Eskel");
        }
    }
}