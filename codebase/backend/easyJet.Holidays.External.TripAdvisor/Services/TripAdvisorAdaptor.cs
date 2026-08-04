using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.TripAdvisor;
using easyJet.Holidays.Api.Domain.Data.Hotels.Reviews;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Dflo.Models.Search;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.TripAdvisor.Services;

/// <summary>
/// Trip Advisor Adaptor, integration to Trip Advisor Service
/// </summary>
public class TripAdvisorAdaptor : ITripAdvisorAdaptor
{
    private readonly IApiService _apiService;
    private readonly EndpointsProvider _endpointsProvider;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TripAdvisorSettings _taSettings;
    private readonly IAWSDbRepository<TripAdvisorCache> _tripAdvisorCacheRepo;
    private readonly AwsSettings _awsSettings;

    /// <summary>
    /// Constructs Trip Advisor Adaptor
    /// </summary>
    /// <param name="apiService"></param>
    /// <param name="endpointsProvider"></param>
    /// <param name="httpContextAccessor"></param>
    /// <param name="taSettings"></param>
    /// <param name="tripAdvisorCacheRepo"></param>
    /// <param name="awsSettings"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public TripAdvisorAdaptor(
        IApiService apiService,
        EndpointsProvider endpointsProvider,
        IHttpContextAccessor httpContextAccessor,
        IOptions<TripAdvisorSettings> taSettings,
        IAWSDbRepository<TripAdvisorCache> tripAdvisorCacheRepo,
        IOptions<AwsSettings> awsSettings)
    {
        ArgumentNullException.ThrowIfNull(taSettings);
        ArgumentNullException.ThrowIfNull(awsSettings);

        _taSettings = taSettings.Value;
        _apiService = apiService;
        _endpointsProvider = endpointsProvider;
        _httpContextAccessor = httpContextAccessor;
        _tripAdvisorCacheRepo = tripAdvisorCacheRepo;
        _awsSettings = awsSettings.Value;
    }

    /// <inheritdoc />
    public async Task<HotelReviews> GetReviews(string id, string language)
    {
        var key = $"{id}_{language}";

        var cachedReviews = await _tripAdvisorCacheRepo.GetItemAsync(key);
        if (cachedReviews is not null && cachedReviews.TTL >= DateTime.UtcNow)
        {
            var hotelReviews = JsonConvert.DeserializeObject<HotelReviews>(cachedReviews.Data);
            if (hotelReviews is null)
            {
                return new();
            }

            return FilterResultsByCurrentLanguage(hotelReviews, language);
        }

        var reviews = await GetData(id, language);

        await _tripAdvisorCacheRepo.SaveAsync(new TripAdvisorCache
        {
            Key = key,
            Data = JsonConvert.SerializeObject(reviews),
            TTL = DateTime.UtcNow.AddSeconds(_awsSettings.TTL.TripAdvisorCache)
        });

        return FilterResultsByCurrentLanguage(reviews, language);
    }

    private HotelReviews FilterResultsByCurrentLanguage(HotelReviews hotelReviews, string language)
    {
        hotelReviews.Reviews = hotelReviews.Reviews.Where(r => language.Contains(r.Lang, StringComparison.Ordinal));

        if (hotelReviews.Reviews.Count() < _taSettings.ReviewsDisplayed)
        {
            return new();
        }

        return hotelReviews;
    }

    private async Task<HotelReviews> GetData(string id, string language)
    {
        var request = new LocationRequest();

        // Build Uri
        var endpointBase = _endpointsProvider.GetEndpoint(TripAdvisorEndpoint.Location, _httpContextAccessor.HttpContext.Request.Cookies);
        request.Endpoint = new Uri($"{endpointBase.AbsoluteUri}/{id}");

        request.Fulltext = true;
        request.Lang = language;
        request.Key = _taSettings.Key;
        request.SetQueryString(null, new QueryStringOptions
        {
            UseBooleanString = true
        });

        var response = await _apiService.GetResponseContentAsyncWithErrorMapping<LocationRequest, LocationResponse>(request, ApiExceptionCodes.TripAdvisorLocationError);
        return response?.Payload.Body;
    }
}