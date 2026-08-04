using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("easyJet.Holidays.External.AWS.RequestedPriceSync.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")] // Moq needs this.
namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services;

/// <inheritdoc cref="IAggregationService"/>
public class AggregationService : IAggregationService
{
    private readonly TransferTypesSettings _transferTypes;
    private readonly ILogger<AggregationService> _logger;
    private readonly IMarketService _marketService;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="marketService"></param>
    /// <param name="logger"></param>
    /// <param name="atcomOptions"></param>
    public AggregationService(IMarketService marketService, ILogger<AggregationService> logger, IOptions<AtcomSettings> atcomOptions)
    {
        _marketService = marketService;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(atcomOptions);
        _transferTypes = atcomOptions.Value.Transfers.Types;
    }

    /// <inheritdoc />
    public virtual Dictionary<string, PricesModel> AggregateOffers(
        IDictionary<RequestedPriceNamedSearch, List<OffersBucket>> namedSearchOffers,
        ConcurrentQueue<(RequestedPriceNamedSearch config, Exception exception)> exceptionCollection,
        bool includeHotelLevel = false,
        int degreeOfParallelization = 1)
    {
        // Group offers
        var priceModels = new ConcurrentDictionary<string, Dictionary<string, RequestedPriceModel>>();
        Parallel.ForEach(
            namedSearchOffers,
            new ParallelOptions() { MaxDegreeOfParallelism = degreeOfParallelization },
            (pair) =>
            {
                try
                {
                    var namedSearch = pair.Key;
                    if (!namedSearch.Id.Contains("|")) namedSearch.Id += $"|{namedSearch.MarketCodeAndLanguage}";
                    _logger.LogInformation("Aggregating results for named search: {Id}. For {CodeAndLanguage} market, Include hotel level: {HotelToggle}", namedSearch.Id, namedSearch.MarketCodeAndLanguage, includeHotelLevel);

                    pair.Value.ForEach(item =>
                    {
                        var offers = item.Offers;
                        var range = item.Range;
                        var destinations = item.Destinations;
                        var virtualDestinations = item.VirtualDestinations?.ToList() ?? [];
                        //by entire named search
                        GroupBySpecificDestinations(priceModels, namedSearch, range, offers, destinations?.Select(destinationItem => destinationItem.Code).ToList(), namedSearch.Id, namedSearch.MarketCodeAndLanguage);

                        //by countries
                        GroupOffersByGeogLevel(priceModels, namedSearch, range, offers, x => $"{x.Accom.FirstOrDefault()?.Cty1}|{namedSearch.MarketCodeAndLanguage}", countryOffers =>
                        {
                            //by regions
                            GroupOffersByGeogLevel(priceModels, namedSearch, range, countryOffers, x => $"{x.Accom.FirstOrDefault()?.Cty2}|{namedSearch.MarketCodeAndLanguage}", locationOffers =>
                            {
                                //by resorts
                                GroupOffersByGeogLevel(priceModels, namedSearch, range, locationOffers, x => $"{x.Accom.FirstOrDefault()?.Cty3}|{namedSearch.MarketCodeAndLanguage}", resortOffers =>
                                {
                                    if (includeHotelLevel)
                                    {
                                        //by hotels
                                        GroupOffersByGeogLevel(priceModels, namedSearch, range, resortOffers, x => $"{x.Accom.FirstOrDefault()?.Code}|{namedSearch.MarketCodeAndLanguage}", null, namedSearch.MarketCodeAndLanguage);
                                    }
                                }, namedSearch.MarketCodeAndLanguage);
                            }, namedSearch.MarketCodeAndLanguage);
                        }, namedSearch.MarketCodeAndLanguage);

                        //by virtual countries, regions, resorts
                        foreach (var virtualDestination in virtualDestinations)
                        {
                            GroupBySpecificDestinations(priceModels, namedSearch, range, offers, virtualDestination.RelatedRegions, virtualDestination.Code, namedSearch.MarketCodeAndLanguage);
                            GroupBySpecificDestinations(priceModels, namedSearch, range, offers, virtualDestination.RelatedResorts, virtualDestination.Code, namedSearch.MarketCodeAndLanguage);
                        }
                    });
                }
                catch (Exception exc)
                {
                    exceptionCollection.Enqueue((pair.Key, exc));
                }
            }
        );

        // Build final model: for each geography code build summary object
        var result = new Dictionary<string, PricesModel>();

        foreach (var pair in priceModels)
        {
            var geogCode = pair.Key;
            var namedSearchItems = pair.Value.Values.ToList();

            result[geogCode] = new PricesModel()
            {
                NamedSearchPrices = namedSearchItems,
                Summary = new RequestedPriceSummaryModel
                {
                    Geog = namedSearchItems.FirstOrDefault()?.Geog,
                    RequestedPriceByMathFunctions = namedSearchItems.FirstOrDefault()?.RequestedPriceByMathFunctions,
                    SearchCriteria = namedSearchItems.FirstOrDefault()?.SearchCriteria,
                    NamedSearches = namedSearchItems.GroupBy(x => x.SearchCriteria.Id).ToDictionary(x => x.Key, y => y.FirstOrDefault()?.RequestedPriceByMathFunctions[RequestedPriceMathFunctionType.Cheapest]?.Price ?? 0),
                    Transfers = namedSearchItems.FirstOrDefault()?.Transfers,
                    Currency = namedSearchItems.FirstOrDefault()?.Currency,
                    MarketCodeAndLanguage = namedSearchItems.FirstOrDefault()?.MarketCodeAndLanguage
                }
            };
        }

        return result;
    }

    internal virtual void GroupBySpecificDestinations(IDictionary<string, Dictionary<string, RequestedPriceModel>> result, RequestedPriceNamedSearch namedSearch, DateRange range, List<AvCacheResultOffersOfferExtended> offers, IReadOnlyCollection<string> destinations, string key, string marketCode)
    {
        if (destinations == null || destinations.Count == 0)
        {
            return;
        }

        var offersList = offers.AsParallel().Where(extended => destinations.Any(destination =>
            extended.Accom.FirstOrDefault()?.Cty1 == destination ||
            extended.Accom.FirstOrDefault()?.Cty2 == destination ||
            extended.Accom.FirstOrDefault()?.Cty3 == destination ||
            extended.Accom.FirstOrDefault()?.Code == destination)).ToList();

        if (offersList.Any())
        {
            if (!key.Contains("|")) key += $"|{namedSearch.MarketCodeAndLanguage}";

            var requestedPriceModel = BuildRequestedPriceModel(offersList, range, namedSearch, key, marketCode);

            if (!result.TryGetValue(key, out var item))
            {
                item = new Dictionary<string, RequestedPriceModel>();
            }

            item[namedSearch.Id] = requestedPriceModel;

            result[key] = item;
        }
    }

    /// <summary>
    /// Group offers by geography code to build price model(cheapest price for each geography level)
    /// </summary>
    /// <param name="result">Result dictionary</param>
    /// <param name="namedSearch">Named search</param>
    /// <param name="range"></param>
    /// <param name="offers">Collection of offers</param>
    /// <param name="geogLevelFunc">Function to get geography code</param>
    /// <param name="processChildren">Function to process child items (you may use recursion to process as many levels as you need)</param>
    /// <param name="marketCodeAndLanguage">Market and language codes</param>
    private void GroupOffersByGeogLevel(
        IDictionary<string, Dictionary<string, RequestedPriceModel>> result,
        RequestedPriceNamedSearch namedSearch,
        DateRange range,
        List<AvCacheResultOffersOfferExtended> offers,
        Func<AvCacheResultOffersOfferExtended, string> geogLevelFunc,
        Action<List<AvCacheResultOffersOfferExtended>> processChildren,
        string marketCodeAndLanguage)
    {
        var groupedByGeog = offers.GroupBy(geogLevelFunc).ToDictionary(x => x.Key, y => y.ToList()); //

        foreach (var group in groupedByGeog)
        {
            var requestedPriceModel = BuildRequestedPriceModel(group.Value, range, namedSearch, group.Key, marketCodeAndLanguage);

            if (!result.TryGetValue(group.Key, out var item))
            {
                item = new Dictionary<string, RequestedPriceModel>();
            }

            item[namedSearch.Id] = requestedPriceModel;

            result[group.Key] = item;

            processChildren?.Invoke(group.Value);
        }
    }

    private RequestedPriceModel BuildRequestedPriceModel(IEnumerable<AvCacheResultOffersOfferExtended> offers, DateRange range, RequestedPriceNamedSearch namedSearch, string key, string marketCodeAndLanguage)
    {
        var orderOfferList = offers.OrderBy(x => x.Price).ToList();
        var cheapestPrice = orderOfferList.FirstOrDefault();
        var mostExpensivePrice = orderOfferList.LastOrDefault();
        var averagePrice = new AvCacheResultOffersOffer
        {
            Price = Math.Round(orderOfferList.Average(x => x.Price), 2, MidpointRounding.AwayFromZero),
            PricePP = Math.Round(orderOfferList.Average(x => x.PricePP), 2, MidpointRounding.AwayFromZero),
            TouristTax = Math.Round(orderOfferList.Average(x => x.PayLocalEst), 2, MidpointRounding.AwayFromZero),
            TouristTaxPP = Math.Round(orderOfferList.Average(x => x.PayLocalEstPP), 2, MidpointRounding.AwayFromZero),
        };
        var mediumPrice = CalculateMediumOffersPrice(orderOfferList);
        var highestInLowerQuartilePrice = CalculateHighestInLowerQuartileOffersPrice(orderOfferList);
        var averageInLowerQuartilePrice = CalculateAverageInLowerQuartileOffersPrice(orderOfferList);

        var departureAirport = cheapestPrice?.Transport?.Route?.FirstOrDefault(x => x.Dir == AvCacheResultOffersOfferTransportRouteDir.O)?.DepPt;
        var requestedPriceModel = new RequestedPriceModel
        {
            Geog = key,
            SearchCriteria = SearchCriteria.WithOfferDetails(namedSearch, range, cheapestPrice?.Date, departureAirport),
            RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>{
                { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions { Price = cheapestPrice?.Price ?? 0,
                    PricePP = cheapestPrice?.PricePP ?? 0, TouristTax = cheapestPrice?.PayLocalEst ?? 0, TouristTaxPP = cheapestPrice?.PayLocalEstPP ?? 0 } },

                { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions { Price = averagePrice.Price,
                    PricePP = averagePrice.PricePP, TouristTax = averagePrice.PayLocalEst, TouristTaxPP = averagePrice.PayLocalEstPP } },

                { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions { Price = averageInLowerQuartilePrice?.Price ?? 0,
                    PricePP = averageInLowerQuartilePrice?.PricePP ?? 0, TouristTax = averageInLowerQuartilePrice?.PayLocalEst ?? 0, TouristTaxPP = averageInLowerQuartilePrice?.PayLocalEstPP ?? 0 } },

                { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions { Price = highestInLowerQuartilePrice?.Price ?? 0,
                    PricePP = highestInLowerQuartilePrice?.PricePP ?? 0, TouristTax = highestInLowerQuartilePrice?.PayLocalEst ?? 0, TouristTaxPP = highestInLowerQuartilePrice?.PayLocalEstPP ?? 0 } },

                { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions { Price = mediumPrice?.Price ?? 0,
                    PricePP = mediumPrice?.PricePP ?? 0, TouristTax = mediumPrice?.PayLocalEst ?? 0, TouristTaxPP = mediumPrice?.PayLocalEstPP ?? 0 } },

                { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions { Price = mostExpensivePrice?.Price ?? 0,
                    PricePP = mostExpensivePrice?.PricePP ?? 0, TouristTax = mostExpensivePrice?.PayLocalEst ?? 0, TouristTaxPP = mostExpensivePrice?.PayLocalEstPP ?? 0 } },
            },
            Transfers = ItemsMapper.MapTransfers(cheapestPrice?.Transfers, _transferTypes, null, null).ToList(),
            MarketCodeAndLanguage = marketCodeAndLanguage,
            Currency = _marketService.GetCurrencyFromMarketCode(marketCodeAndLanguage.Split("|")[0])
        };

        return requestedPriceModel;
    }

    private static AvCacheResultOffersOffer CalculateHighestInLowerQuartileOffersPrice(List<AvCacheResultOffersOfferExtended> orderOfferList)
    {
        int numberCount = orderOfferList.Count;
        var index = numberCount / 4;
        index = index == 0 ? index : index - 1;

        return orderOfferList[index];
    }

    private static AvCacheResultOffersOffer CalculateAverageInLowerQuartileOffersPrice(List<AvCacheResultOffersOfferExtended> orderOfferList)
    {
        int numberCount = orderOfferList.Count;
        var index = numberCount / 4;
        index = index == 0 ? index : index - 1;

        var counter = 0;
        var avCacheResultOffersOffer = new AvCacheResultOffersOffer();
        for (var i = 0; i < index + 1; i++)
        {
            avCacheResultOffersOffer.Price += orderOfferList[i].Price;
            avCacheResultOffersOffer.PricePP += orderOfferList[i].PricePP;
            avCacheResultOffersOffer.PayLocalEst += orderOfferList[i].PayLocalEst;
            avCacheResultOffersOffer.PayLocalEstPP += orderOfferList[i].PayLocalEstPP;
            counter++;
        }
        avCacheResultOffersOffer.Price = Math.Round(avCacheResultOffersOffer.Price / counter, 2, MidpointRounding.AwayFromZero);
        avCacheResultOffersOffer.PricePP = Math.Round(avCacheResultOffersOffer.PricePP / counter, 2, MidpointRounding.AwayFromZero);
        avCacheResultOffersOffer.PayLocalEst = Math.Round(avCacheResultOffersOffer.PayLocalEst / counter, 2, MidpointRounding.AwayFromZero);
        avCacheResultOffersOffer.PayLocalEstPP = Math.Round(avCacheResultOffersOffer.PayLocalEstPP / counter, 2, MidpointRounding.AwayFromZero);
        return avCacheResultOffersOffer;
    }

    private static AvCacheResultOffersOffer CalculateMediumOffersPrice(List<AvCacheResultOffersOfferExtended> orderOfferList)
    {
        int numberCount = orderOfferList.Count;
        if (numberCount % 2 != 0)
        {
            return orderOfferList[(numberCount - 1) / 2];

        }

        return orderOfferList[orderOfferList.Count / 2];
    }
}