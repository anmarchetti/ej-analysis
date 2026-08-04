using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Services.Search;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using SearchType = easyJet.Holidays.Api.Domain.Data.PackageOffers.SearchType;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services;

/// <inheritdoc cref="ISearchService"/>
public class SearchService : ISearchService
{
    private readonly SearchOffersService _searchOffersService;
    private readonly SearchAvailablePackagesFilterAndMapper _searchAvailablePackagesFilterAndMapper;
    private readonly SearchSettings _searchSettings;
    private readonly ILogger<SearchService> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="searchOffersService"></param>
    /// <param name="searchAvailablePackagesFilterAndMapper"></param>
    /// <param name="searchSettings"></param>
    /// <param name="logger"></param>
    public SearchService(
        SearchOffersService searchOffersService,
        SearchAvailablePackagesFilterAndMapper searchAvailablePackagesFilterAndMapper,
        IOptions<SearchSettings> searchSettings,
        ILogger<SearchService> logger)
    {
        ArgumentNullException.ThrowIfNull(searchSettings);
        _searchSettings = searchSettings.Value;
        _searchOffersService = searchOffersService;
        _searchAvailablePackagesFilterAndMapper = searchAvailablePackagesFilterAndMapper;
        _logger = logger;
    }

    /// <inheritdoc />
    public virtual async Task<List<AvCacheResultOffersOfferExtended>> Search(RequestedPriceNamedSearch namedSearchRequest, List<DestinationItem> destinationItems)
    {
        ArgumentNullException.ThrowIfNull(namedSearchRequest);

        var packagesRequest = MapToPackagesSearchRequest(namedSearchRequest);

        var result = await GeographyParseUtils.SplitRequestByDestinations(packagesRequest, _searchOffersService.DoSearch, destinationItems);

        var offers = result
            .Select(x => x.Item1?.Payload?.Body?.Result?.Offers?.Offer ?? Array.Empty<AvCacheResultOffersOffer>())
            .Aggregate((x, y) => x.Concat(y).ToArray())
            .ToList();

        var searchOffersResponseExtended = await _searchAvailablePackagesFilterAndMapper.TransformOriginalOffers(offers, packagesRequest,
            ignoreFilters: false, ignoreFilterOptions: true, sortAndPaginate: false);

        var avCacheResultOffers = searchOffersResponseExtended.AvCacheResultOffers;

        return avCacheResultOffers;
    }

    /// <summary>
    /// Map RequestedPriceNamedSearch to PackagesSearchRequest
    /// </summary>
    internal PackagesSearchRequest MapToPackagesSearchRequest(RequestedPriceNamedSearch namedSearchRequest)
    {
        _logger.LogInformation("MapToPackagesSearchRequest namedSearchRequest: {Request}", JsonConvert.SerializeObject(namedSearchRequest));

        return new PackagesSearchRequest
        {
            StartDate = namedSearchRequest.StartDate.ToString(DateFormatUtils.DateOnlyFormat),
            EndDate = namedSearchRequest.EndDate.ToString(DateFormatUtils.DateOnlyFormat),
            FlexibleDays = namedSearchRequest.IsFlexibleDatesRange ? _searchSettings.DefaultFlexibleDays : 0,
            DiscountOnly = namedSearchRequest.DiscountOnly,
            Duration = new List<int> { namedSearchRequest.Duration },
            Departure = MapEnumerableToString(namedSearchRequest.Origin),
            AutomaticAllocation = true,
            Room = new List<RoomAllocation>
            {
                new RoomAllocation
                {
                    Adults = namedSearchRequest.Adults,
                    Children = namedSearchRequest.Children,
                    Infants = namedSearchRequest.Infants
                }
            },
            ChildAges = MapEnumerableToString(namedSearchRequest.ChildAges),
            Offers = namedSearchRequest.FreeForKidsOnly ? OfferConstants.FreeForKidsFilter : null,
            SearchType = SearchType.Promo,
            Themes = MapEnumerableToString(namedSearchRequest.ThemeTypesCodes),
            Facilities = MapEnumerableToString(namedSearchRequest.FacilityTypes),
            BoardType = MapEnumerableToString(namedSearchRequest.BoardTypes),
            StarRating = MapEnumerableToString(namedSearchRequest.StarRating),
            TripAdvisorRating = (int)Math.Ceiling(namedSearchRequest.TripAdvisorRating),
            DistressedFlightsOnly = false,
            InitialTotalPriceFrom = namedSearchRequest.MinTotalPrice,
            InitialTotalPriceTo = namedSearchRequest.MaxTotalPrice,
            InitialPricePPFrom = namedSearchRequest.MinPPPrice,
            InitialPricePPTo = namedSearchRequest.MaxPPPrice,
            MaxDisc = namedSearchRequest.DiscountAmountMax,
            MinDisc = namedSearchRequest.DiscountAmountMin,
            MaxDiscP = namedSearchRequest.DiscountPercentsMax,
            MinDiscP = namedSearchRequest.DiscountPercentsMin,
            IsPromo = true,
            MarketCode = namedSearchRequest.MarketCode,
            Promc = MapEnumerableToString(namedSearchRequest.PromoCollections)
        };
    }

    private static string MapEnumerableToString(IEnumerable<string> stringEnumerable)
    {
        var enumerated = stringEnumerable?.ToList() ?? [];

        if (enumerated is {Count: >0})
            return string.Join(',', enumerated);

        return null;
    }
}