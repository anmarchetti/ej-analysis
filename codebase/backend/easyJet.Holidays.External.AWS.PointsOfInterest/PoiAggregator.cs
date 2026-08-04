using PointsOfInterest.Ancillaries;
using PointsOfInterest.Integrations.AwsBedrock;
using PointsOfInterest.Integrations.AwsPlaces;
using PointsOfInterest.Integrations.Sitecore;
using PointsOfInterest.Models;

namespace PointsOfInterest;

internal interface IPoiAggregator
{
    Task GeneratePOIsForResorts(PoiGenerationRequest request);
}

internal sealed class PoiAggregator : IPoiAggregator
{
    private readonly ISitecoreApiClient _sitecoreClient;
    private readonly IBedrockClient _bedrockClient;
    private readonly IAwsPlacesClient _awsPlacesClient;
    private readonly IPointOfInterestRepository _pointOfInterestRepository;

    public PoiAggregator(ISitecoreApiClient sitecoreClient, 
        IAwsPlacesClient awsPlacesClient, IPointOfInterestRepository pointOfInterestRepository, IBedrockClient amazonBedrockClient)
    {
        _sitecoreClient = sitecoreClient;
        _awsPlacesClient = awsPlacesClient;
        _bedrockClient = amazonBedrockClient;
        _pointOfInterestRepository = pointOfInterestRepository;
    }

    public async Task GeneratePOIsForResorts(PoiGenerationRequest request)
    {
        // Step 1: Get resort data (central point/radius already calculated)
        var resorts = await _sitecoreClient.GetResorts(request);

        var poiTasks = resorts.Select(_awsPlacesClient.SearchNearby);
        await Task.WhenAll(poiTasks);

        var tasks = resorts.Select(_bedrockClient.EnrichPOIData);
        await Task.WhenAll(tasks);

        await _pointOfInterestRepository.RefreshResortPoiByResorts([.. resorts]);
    }
}
