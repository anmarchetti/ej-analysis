using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PointsOfInterest.Ancillaries;
using PointsOfInterest.Models;

namespace PointsOfInterest.Integrations.Sitecore;

internal interface ISitecoreApiClient
{
    Task<List<Resort>> GetResorts(PoiGenerationRequest request);
}

internal sealed class SitecoreApiClient : ISitecoreApiClient
{
    private const int SingleHotelDefaultRadius = 30;
    private const int radiusBufferKm = 5;
    private readonly IHttpClientWrapper _httpClientWrapper;
    private readonly ILogger<SitecoreApiClient> _logger;
    private readonly SitecoreClientOptions _sitecoreOptions;

    public SitecoreApiClient(IHttpClientWrapper httpClientWrapper,
        ILogger<SitecoreApiClient> logger,
        IOptions<SitecoreClientOptions> sitecoreOptions)
    {
        _httpClientWrapper = httpClientWrapper ?? throw new ArgumentNullException(nameof(httpClientWrapper));
        _logger = logger;
        _sitecoreOptions = sitecoreOptions.Value;
    }

    public async Task<List<Resort>> GetResorts(PoiGenerationRequest request)
    {
        try
        {
            IEnumerable<Resort> getResortsResponse = await GetSitecoreResorts(request);
            var resorts = getResortsResponse.Where(r => !string.IsNullOrEmpty(r.Theme) && !string.IsNullOrEmpty(r.CountryCode)).ToList();

            PopulateQueryPositionAndRadius(resorts);

            return resorts;
        }
        catch (PointsOfInterestException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetResorts");
            throw new PointsOfInterestException(System.Net.HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    private async Task<IEnumerable<Resort>> GetSitecoreResorts(PoiGenerationRequest request)
    {
        IEnumerable<Resort> getResortsResponse = await _httpClientWrapper
            .PostJson<HotelsByIdsRequest, IEnumerable<Resort>>(
                $"{_sitecoreOptions.BaseUrl}{_sitecoreOptions.GetResorts}",
                new HotelsByIdsRequest() {AtcomIds = request?.ResortCodes?.ToArray() ?? []}) ?? [];

        return getResortsResponse;
    }

    private void PopulateQueryPositionAndRadius(IEnumerable<Resort> resorts)
    {
        foreach (var resort in resorts)
        {
            ResortCenterCalculator.ComputeResortCenter(
                resort,
                _sitecoreOptions.ResortCenterMinAbsKm,
                _sitecoreOptions.ResortCenterMadMultiplier,
                _sitecoreOptions.ResortCenterNeighbourKmThreshold);

            if (resort.UsedHotels.Count == 1)
            {
                resort.Radiuskm = SingleHotelDefaultRadius;
                continue;
            }

            resort.Radiuskm = (int)resort.UsedHotels.Max(hotel => GeoUtils.HaversineKm(resort.QueryPositionLatitude, resort.QueryPositionLongitude, hotel.Latitude, hotel.Longitude));
            resort.Radiuskm += radiusBufferKm; // add buffer of 5 km

            if (resort.ExcludedHotels.Count > 0)
            {
                foreach (var hotel in resort.ExcludedHotels)
                {
                    _logger.LogInformation("Resort {ResortCode} excluded hotel GiataCode {HotelGiataId}, from radius calculation due to invalid coordinates lat {Lat} long {Long}.",
                        resort.ResortCode, hotel.GiataCode, hotel.Latitude, hotel.Longitude);
                }
            }
            
            if (resort.UsedHotels.Count > 0)
            {
                foreach (var hotel in resort.UsedHotels)
                {
                    _logger.LogInformation("Resort {ResortCode} included hotel GiataCode {HotelGiataId} in radius calculation valid coordinates lat {Lat} long {Long}.",
                        resort.ResortCode, hotel.GiataCode, hotel.Latitude, hotel.Longitude);
                }
            }

            _logger.LogInformation("Resort {ResortCode} calculated radius: {Radius} km based on {HotelCount} valid hotel positions.", resort.ResortCode, resort.Radiuskm, resort.UsedHotels.Count);
        }
    }
}
