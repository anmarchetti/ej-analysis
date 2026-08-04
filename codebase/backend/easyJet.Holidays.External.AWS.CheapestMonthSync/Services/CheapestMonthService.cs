using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Data.Search;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Services.Interfaces;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Settings;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.CheapestMonthSync.Services;
/// <summary>
/// CheapestMonthService
/// </summary>
public class CheapestMonthService : ICheapestMonthService
{
    private readonly LambdaSettings _lambdaSettings;
    private readonly AtcomSettings _atcomSettings;
    private readonly IAtcomRequestParamBuilder _atcomRequestParamBuilder;
    private readonly SearchOffersService _searchOffersService;
    private readonly ILogger<CheapestMonthService> _logger;
    private const string DurationDays = "7";
    private const int AdultCount = 2;

    /// <summary>
    /// Initializes a new instance of the <see cref="CheapestMonthService"/> class.
    /// </summary>
    /// <param name="atcomRequestParamBuilder">The atcom request param builder.</param>
    /// <param name="searchOffersService">The search offers service.</param>
    /// <param name="logger">The logger.</param>
    /// <param name="lambdaSettings">The lambda settings.</param>
    /// <param name="atcomSettings">The atcom settings.</param>
    public CheapestMonthService(
         IAtcomRequestParamBuilder atcomRequestParamBuilder,
         SearchOffersService searchOffersService,
         ILogger<CheapestMonthService> logger,
         IOptions<LambdaSettings> lambdaSettings,
         IOptions<AtcomSettings> atcomSettings)
    {
        _lambdaSettings = lambdaSettings != null ? lambdaSettings.Value : throw new ArgumentNullException(nameof(lambdaSettings));
        _atcomSettings = atcomSettings != null ? atcomSettings.Value : throw new ArgumentNullException(nameof(atcomSettings));
        _atcomRequestParamBuilder = atcomRequestParamBuilder;
        _searchOffersService = searchOffersService;
        _logger = logger;
    }

    /// <summary>
    /// Finds the cheapest month.
    /// </summary>
    /// <param name="searchSelectionMessage">The search selection message.</param>
    /// <param name="dateRangeChunk">The date range chunk.</param>
    /// <returns>A Task.</returns>
    public async Task<CheapestMonthDetails?> FindCheapestMonth(SearchSelectionData? searchSelectionMessage, DateTimeRange? dateRangeChunk)
    {
        ArgumentNullException.ThrowIfNull(dateRangeChunk);
        ArgumentNullException.ThrowIfNull(searchSelectionMessage);

        var searchRequest = new SearchAvailablePackagesRequest
        {
            StartDate = DateFormatUtils.DateOnly(dateRangeChunk.From),
            EndDate = DateFormatUtils.DateOnly(dateRangeChunk.To),
            Duration = DurationDays,
            Departure = [searchSelectionMessage.AirportCode.ToUpperInvariant()],
            Adults = AdultCount,
            Children = 0,
            Infants = 0,
            Rooms = 0
        };

        searchRequest.Geography = _atcomRequestParamBuilder.BuildGeographyParamValue(searchSelectionMessage);
        searchRequest.SearchType = _lambdaSettings.AtcomSearchType.Report;
        //use promo search to protect the general search traffic (atcom recommendation)
        //R value setup which route to promo without caching (atcom recommendation)
        searchRequest.PromoPageId = _lambdaSettings.PromoPageId.ToString();
        searchRequest.SetQueryString(_atcomSettings.EndpointTemplate.Search);

        var atcomOffersResult = await _searchOffersService.DoSearch(searchRequest, "UK");
        if (atcomOffersResult?.Payload?.Body?.Result?.Offers == null || atcomOffersResult.Payload.Body.Result.Offers.Count == 0 || (atcomOffersResult.Payload.Body.Result.Offers.Offer?.Length ?? 0) == 0)
        {
            _logger.LogError("Atcom offers has not been found for geography: {Geography}, departure: {Dep}, startdate: {StartDate}.", searchRequest.Geography, searchRequest.Departure, searchRequest.StartDate);
            return null;
        }
        var atcomOffers = atcomOffersResult.Payload.Body.Result.Offers;
        var cheapestAtcomOffer = atcomOffers.Offer.MinBy(x => x.Price);

        if (cheapestAtcomOffer is null)
        {
            _logger.LogError("Atcom cheapest offer has not been found for geography: {Geography}, departure: {Dep}, startdate: {StartDate}.", searchRequest.Geography, searchRequest.Departure, searchRequest.StartDate);
            throw new InvalidOperationException("Atcom cheapest offer has not been found");
        }
        var cheapestMonth = new CheapestMonthDetails
        {
            AirportCode = searchSelectionMessage.AirportCode,
            Destination = searchRequest.Geography,
            SearchStartDate = DateFormatUtils.DateOnly(dateRangeChunk.From).ToString(),
            Month = cheapestAtcomOffer.Date.Month,
            Year = cheapestAtcomOffer.Date.Year,
            Price = cheapestAtcomOffer.Price,
            PricePP = cheapestAtcomOffer.PricePP,
        };

        return cheapestMonth;
    }
}
