using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Apollo.Helpers;
using easyJet.Holidays.External.Apollo.Models;
using easyJet.Holidays.External.Apollo.Models.Base;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

#nullable enable

namespace easyJet.Holidays.External.Apollo.Services;

/// <summary>
/// Apollo booking service that builds GraphQL requests and maps booking results.
/// </summary>
public class ApolloService : IApolloService
{
    private const string BookingsByEncryptedMemberIdCachePrefix = "ApolloGraphQlBookingsByEncryptedMemberId";

    private readonly IApolloAwsRequestTemplate _requestTemplate;
    private readonly EndpointsProvider _endpointsProvider;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ICacheService _cacheService;
    private readonly CacheSettings _cacheSettings;
    private readonly ILogger<ApolloService> _logger;

    /// <summary>
    /// Creates an instance of <see cref="ApolloService"/>.
    /// </summary>
    public ApolloService(
        IApolloAwsRequestTemplate requestTemplate,
        EndpointsProvider endpointsProvider,
        IHttpContextAccessor httpContextAccessor,
        IOptions<ApolloSettings> settings,
        ICacheService cacheService,
        IOptions<CacheSettings> cacheSettings,
        ILogger<ApolloService> logger)
    {
        _ = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _cacheSettings = cacheSettings?.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
        _requestTemplate = requestTemplate;
        _endpointsProvider = endpointsProvider;
        _httpContextAccessor = httpContextAccessor;
        _cacheService = cacheService;
        _logger = logger;
    }

    /// <summary>
    /// Returns bookings filtered by encrypted member id.
    /// </summary>
    public Task<UpcomingBookingsModel> GetUpcomingBookingsByEncryptedMemberId(
        string encryptedMemberId,
        int limit = 100,
        string? nextToken = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(encryptedMemberId);
        if (limit <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(limit), "Limit must be greater than zero.");
        }

        var endpoint = _endpointsProvider.GetEndpoint(ApolloEndpoint.GraphQl, _httpContextAccessor.HttpContext?.Request.Cookies);
        var keys = new[]
        {
            BookingsByEncryptedMemberIdCachePrefix,
            encryptedMemberId
        };

        return _cacheService.GetOrAddAsync(_cacheSettings.Buckets.ApolloBookingsCache, keys, async () =>
        {
            var request = new ApolloGraphQlRequest
            {
                Query = BuildBookingsByEncryptedMemberIdQuery(),
                OperationName = "BookingsByEncryptedMemberId",
                Variables = new
                {
                    encryptedMemberId,
                    limit,
                    nextToken
                }
            };

            var result = await ExecuteBookingsQueryAsync<ApolloUpcomingBookingConnectionResult, ApolloUpcomingBooking>(endpoint, request, "bookings by encryptedMemberId");
            var mappedBookings = (result.Items ?? Enumerable.Empty<ApolloUpcomingBooking>())
                .Select(MapUpcomingBooking)
                .ToList();

            return new UpcomingBookingsModel
            {
                Bookings = mappedBookings
            };
        }, false);
    }

    private static UpcomingBookingModel MapUpcomingBooking(ApolloUpcomingBooking model)
    {
        var firstDestination = model.Destinations?.FirstOrDefault();
        var hotel = firstDestination?.Hotel;
        var location = firstDestination?.Location;
        var hotelLocation = location != null
            ? $"{location.ResortName}, {location.RegionName}, {location.CountryName}"
            : hotel?.HotelLocation;
        
        var holiday = model.Holiday;

        return new UpcomingBookingModel
        {
            BookingReference = model.Reference ?? string.Empty,
            HotelCode = hotel?.HotelCode ?? string.Empty,
            HotelName = hotel?.HotelName ?? string.Empty,
            HotelLocation = hotelLocation ?? string.Empty,
            ResortCode = location?.ResortCode ?? string.Empty,
            HolidayDateStartLocal = holiday?.HolidayStartDateLocal ?? default,
            HolidayDateEndLocal = holiday?.HolidayEndDateLocal ?? default,
            HolidayNightsCount = holiday?.HolidayNightsCount ?? 0,
            DepartureDatetimeLocal = model.Outbound?.FlightDepartureDatetimeLocal ?? default,
            DepartureDatetimeUtc = model.Outbound?.FlightDepartureDatetimeUtc ?? default,
        };
    }

    private static string BuildBookingsByEncryptedMemberIdQuery()
    {
        return BuildGraphQlQuery(
            operationName: "BookingsByEncryptedMemberId",
            variableDefinitions: "$encryptedMemberId: String!, $limit: Int = 100, $nextToken: String",
            rootFieldExpression: """
                                 bookings(
                                   filter: 
                                   {
                                    encryptedMemberId: { eq: $encryptedMemberId }
                                    status: { eq: "BKG" }
                                    bookingType: { eq: "LIVE" }
                                   }
                                   limit: $limit
                                   nextToken: $nextToken
                                 )
                                 """,
            selectionSet: BuildSelectionSet(),
            isConnectionResponse: true);
    }

    private static string BuildSelectionSet()
    {
        var lines = GraphQlFieldsProvider.GetUpcomingBookingFieldsSet.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n');
        return string.Join(Environment.NewLine, lines.Select(x => $"      {x.TrimEnd()}"));
    }

    private static string BuildGraphQlQuery(
        string operationName,
        string variableDefinitions,
        string rootFieldExpression,
        string selectionSet,
        bool isConnectionResponse)
    {
        if (isConnectionResponse)
        {
            return $$"""
                     query {{operationName}}({{variableDefinitions}}) {
                       {{rootFieldExpression}} {
                         items {
                     {{selectionSet}}
                         }
                         nextToken
                       }
                     }
                     """;
        }

        return $$"""
                 query {{operationName}}({{variableDefinitions}}) {
                   {{rootFieldExpression}} {
                 {{selectionSet}}
                   }
                 }
                 """;
    }

    private async Task<T> ExecuteBookingsQueryAsync<T, Y>(
        Uri endpoint,
        ApolloGraphQlRequest request,
        string operationDescription)
    where T : IApolloConnectionResult<Y>, new()
    where Y : IApolloBookingsModel, new()
    {
        try
        {
            var response = await _requestTemplate.GetGraphQlResponseAsync<ApolloGraphQlResponse<ApolloBookingsData<Y>>>(endpoint, request);
            if (response.HasErrors)
            {
                _logger.LogError(
                    "Apollo GraphQL {Operation} returned errors: {Messages}. OperationName: {OperationName}. Query: {Query}. Variables: {Variables}",
                    operationDescription,
                    string.Join(" | ", response.Errors!.Select(x => x.Message)),
                    request.OperationName,
                    request.Query,
                    JsonConvert.SerializeObject(request.Variables));
                return new T
                {
                    Items = Enumerable.Empty<Y>(),
                    NextToken = null
                };
            }

            var items = response.Data?.Bookings?.Items ?? Enumerable.Empty<Y>();
            if (!items.Any() && response.Data?.BookingByReference is not null)
            {
                items = response.Data.BookingByReference.Values
                    .Where(x => x is not null)
                    .Select(x => x!)
                    .ToArray();
            }

            return new T
            {
                Items = items,
                NextToken = response.Data?.Bookings?.NextToken
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Apollo GraphQL {Operation} request failed.", operationDescription);
            return new T
            {
                Items = Enumerable.Empty<Y>(),
                NextToken = null
            };
        }
    }
}
