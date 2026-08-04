using easyJet.Holidays.External.AWS.FreeNightsDataSync.Interfaces;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Models;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.FreeNightsDataSync.Repositories;

/// <inheritdoc cref="IFreeNightsRepository"/>
public class FreeNightsRepository : IFreeNightsRepository
{
    private readonly IApiService _apiService;
    private readonly ILogger<FreeNightsRepository> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="apiService"></param>
    /// <param name="logger"></param>
    /// <param name="lambdaOptions"></param>
    public FreeNightsRepository(
        [FromKeyedServices("EskelApi")] IApiService apiService,
        ILogger<FreeNightsRepository> logger,
        IOptions<LambdaSettings> lambdaOptions)
    {
        _apiService = apiService;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }

    /// <inheritdoc />
    public async Task<FreeNight[]> GetAll()
    {
        try
        {
            var freeNightsRequest = new FreeNightsRequest
            {
                Endpoint = _lambdaSettings.EskelUri
            };

            var responseContentAsync =
                await _apiService.GetResponseContentAsync<FreeNightsRequest, FreeNightsResponse>(freeNightsRequest);

            return responseContentAsync?.Payload?.Body;
        }
        catch (Exception exc)
        {
            _logger.LogError(exc, "Failed to get free nights information from Eskel system");
            throw new InvalidOperationException("Failed to retrieve data from Eskel");
        }
    }
}