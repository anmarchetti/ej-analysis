using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using Microsoft.Extensions.Logging;
using PointsOfInterest.Models;
using System.Diagnostics; // added for Stopwatch

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace PointsOfInterest;

internal class Function
{
    private readonly IPoiAggregator _poiAggregator;
    private readonly ILogger<Function> _logger;

    public Function(IPoiAggregator poiAggregator,ILogger<Function> logger)
    {
        _poiAggregator = poiAggregator ?? throw new ArgumentNullException(nameof(poiAggregator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [LambdaFunction()]
    public async Task Handler(PoiGenerationRequest? request, ILambdaContext context)
    {
        var stopwatch = Stopwatch.StartNew(); // start timing
        try
        {
            request ??= new PoiGenerationRequest();

            _logger.LogInformation(
                "POI generation started. ResortIdsCount={ResortIdsCount}",
                request.ResortCodes?.Count ?? 0);

            await _poiAggregator.GeneratePOIsForResorts(request);

            _logger.LogInformation("POI generation completed.");
        }
        catch (PointsOfInterestException ex)
        {
            _logger.LogError(ex, "POI generation failed with PointsOfInterestException.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POI generation failed with unexpected exception message {Message}", ex.Message);
        }
        finally
        {
            stopwatch.Stop();
            _logger.LogInformation("POI generation total execution time {ElapsedMilliseconds}ms", stopwatch.ElapsedMilliseconds);
        }
    }
}
