using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Data.Luggage;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Luggage;

/// <inheritdoc />
public class FlightExtraCacheService : IFlightExtraCacheService
{
    private readonly IAWSDbRepository<FlightExtraCache> _flightExtraRepo;
    private readonly ILogger<FlightExtraCache> _logger;
    private readonly AwsSettings _awsSettings;

    /// <summary>
    /// Creates instance with all dependencies resolved
    /// </summary>
    public FlightExtraCacheService(
        IAWSDbRepository<FlightExtraCache> flightExtraRepo,
        ILogger<FlightExtraCache> logger,
        IOptions<AwsSettings> awsSettings)
    {
        _flightExtraRepo = flightExtraRepo;
        _logger = logger;
        _awsSettings = awsSettings?.Value ?? throw new ArgumentNullException(nameof(awsSettings));
    }

    /// <inheritdoc />
    public async Task<IList<FlightExtraCategoryList>> GetFlightExtras(
        FlightId[] flights,
        Func<Task<IList<FlightExtraCategoryList>>> fetchFunction,
        bool forceFetch)
    {
        if (forceFetch)
            return await Get();

        var cachedFlightExtras = await GetCached();
        if (cachedFlightExtras.Any())
            return cachedFlightExtras;

        return await Get();

        async Task<IList<FlightExtraCategoryList>> Get()
        {
            var flightExtras = await fetchFunction();

            if (flightExtras.IsNullOrEmpty())
            {
                var flightIdsString = string.Join(", ", flights.Select(BuildKey));
                _logger.LogWarning($"Flights: {flightIdsString} have no extras");
                return Array.Empty<FlightExtraCategoryList>();
            }

            return await CacheFlightExtras(flights, flightExtras);
        }

        // Gets actual cached extras 
        async Task<FlightExtraCategoryList[]> GetCached()
        {
            var cacheKeys = flights.Select(BuildKey);
            var caches = await _flightExtraRepo.GetAsync(cacheKeys);

            // Check if cache is not corrupted
            if (caches is null || caches.Any(x => x is null))
                return Array.Empty<FlightExtraCategoryList>();

            // DynamoDB deletes data eventually, we have to check if saved cache is fresh
            var allAreUpdated = caches.All(cache => cache?.TTL.ToUniversalTime() >= DateTime.UtcNow);
            var flightExtras =
                allAreUpdated
                    ? caches.Select(cache => cache.Extra).ToArray()
                    : Array.Empty<FlightExtraCategoryList>();

            // Checks if the cache contains all requested data  
            if (flights.Length > flightExtras.Count())
                return Array.Empty<FlightExtraCategoryList>();

            return flightExtras;
        }
    }

    /// <summary>
    /// Cache flight extras into Dynamo DB and returned cached extras
    /// </summary>
    private async Task<IList<FlightExtraCategoryList>> CacheFlightExtras(
        IEnumerable<FlightId> flights,
        IEnumerable<FlightExtraCategoryList> flightExtras)
    {
        var cachedFlightExtras = (
            from flight in flights
            join extra in flightExtras
                on flight.FlightNumber equals extra.FlightNumber into groupedExtras
            select new FlightExtraCache
            {
                FlightId = BuildKey(flight),
                Extra = groupedExtras.FirstOrDefault(),
                TTL = DateTime.UtcNow.AddSeconds(_awsSettings.TTL.FlightExtraCacheInSec),
            }
        ).ToArray();

        var nullableFlightExtra = cachedFlightExtras
            .Where(x => x.Extra is null)
            .Select(x => x.FlightId)
            .ToArray();
        if (nullableFlightExtra.Any())
            throw new ArgumentException(
                $"Could find flight extra luggage for {string.Join(", ", nullableFlightExtra)} flights",
                nameof(flightExtras)
            );

        try
        {
            await _flightExtraRepo.SaveAsync(cachedFlightExtras);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create a flight extra cache");
        }

        return cachedFlightExtras.Select(cache => cache.Extra).ToList();
    }

    /// <summary>
    /// Builds string key for DynamoDB
    /// </summary>
    private static string BuildKey(FlightId id)
    {
        return $"{id.RouteId}-{id.FlightNumber}-{id.DepartureAirportCode}-{id.ArrivalAirportCode}-{id.DepartureDate:yyyMMdd}";
    }
}