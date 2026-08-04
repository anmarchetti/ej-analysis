using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.External.AWS.LivePriceSync.Models;
using Microsoft.Extensions.Logging;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("easyJet.Holidays.External.AWS.LivePriceSync.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")] // Moq needs this.
namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

/// <inheritdoc cref="ILivePriceAggregationService"/>
public class LivePriceAggregationService : ILivePriceAggregationService
{
    private readonly ILogger<LivePriceAggregationService> _logger;

    /// <summary>
    /// Ctor
    /// </summary>
    /// <param name="logger"></param>
    public LivePriceAggregationService(ILogger<LivePriceAggregationService> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc/>
    public virtual Dictionary<string, GeogPricesModel> AggregateOffers(MarketInfo market,
        Dictionary<NamedSearch, List<OffersBucket>> namedSearchOffers,
        IList<(NamedSearch Search, Exception Exc)> exceptionsDuringAggregation)
    {
        ArgumentNullException.ThrowIfNull(exceptionsDuringAggregation);
        ArgumentNullException.ThrowIfNull(namedSearchOffers);
        ArgumentNullException.ThrowIfNull(market);

        // Group offers by geography code
        var priceModelsByGeog = new Dictionary<string, Dictionary<string, LivePriceModel>>();
        foreach (var pair in namedSearchOffers)
        {
            try
            {
                var namedSearch = pair.Key;

                pair.Value.ForEach(item =>
                {
                    var offers = item.Offers;
                    var range = item.Range;

                    GroupOffersByGeogLevel(market, priceModelsByGeog, namedSearch, range, offers, x => x.Accom.Country, countryOffers =>
                    {
                        GroupOffersByGeogLevel(market, priceModelsByGeog, namedSearch, range, countryOffers, x => x.Accom.Region, regionOffers =>
                        {
                            GroupOffersByGeogLevel(market, priceModelsByGeog, namedSearch, range, regionOffers, x => x.Accom.Resort, resortOffers =>
                            {
                                GroupOffersByGeogLevel(market, priceModelsByGeog, namedSearch, range, resortOffers, x => x.GiataCode, null);
                            });
                        });
                    });

                });
            }
            catch (Exception exc)
            {
                _logger.LogError(exc, "failed to aggregate {ID}", pair.Key.Id);
                exceptionsDuringAggregation.Add((pair.Key, exc));
            }
        }

        // Build final model: for each geography code build summary object
        var result = new Dictionary<string, GeogPricesModel>();

        foreach (var pair in priceModelsByGeog)
        {
            var geogCode = pair.Key;
            var namedSearchItems = pair.Value.Values;
            var summaries = namedSearchItems
                .GroupBy(x => x.Language)
                .Select(pricesInLanguage =>
                {
                    var cheapestPriceInLanguage = pricesInLanguage.OrderBy(x => x.Price).First();    // we always  have at least one value in collection

                    return new LivePriceSummaryModel
                    {
                        PackageId = cheapestPriceInLanguage.PackageId,
                        Geog = cheapestPriceInLanguage.Geog,
                        Price = cheapestPriceInLanguage.Price,
                        PricePP = cheapestPriceInLanguage.PricePP,
                        TouristTax = cheapestPriceInLanguage.TouristTax,
                        TouristTaxPP = cheapestPriceInLanguage.TouristTaxPP,
                        PriceExcludingTouristTax = cheapestPriceInLanguage.Price - cheapestPriceInLanguage.TouristTax,
                        PricePPExcludingTouristTax = cheapestPriceInLanguage.PricePP - cheapestPriceInLanguage.TouristTaxPP,
                        TaxesAndFees = cheapestPriceInLanguage.TaxesAndFees?.Count > 0 ? cheapestPriceInLanguage.TaxesAndFees.Select(x => new KeyValuePair<string, TaxesAndFeesSummary>(x.Key, new TaxesAndFeesSummary
                        {
                            TotalLocalPrice = x.Value.TotalLocalPrice,
                            TotalLocalPricePP = x.Value.TotalLocalPricePP,
                            Currency = x.Value.Currency,
                            ExchRt = x.Value.ExchRt,
                        })).ToDictionary(x => x.Key, x => x.Value) : null,
                        SearchCriteria = cheapestPriceInLanguage.SearchCriteria,
                        NamedSearches = pricesInLanguage.GroupBy(x => x.SearchCriteria.Name).ToDictionary(x => x.Key, y => y.FirstOrDefault()?.Price ?? 0),
                        Transfers = cheapestPriceInLanguage.Transfers,
                        Currency = cheapestPriceInLanguage.Currency,
                        Market = cheapestPriceInLanguage.Market,
                        Language = cheapestPriceInLanguage.Language,
                        AccomCode = cheapestPriceInLanguage.AccomCode,
                        ExtraLuggageInfo = cheapestPriceInLanguage.ExtraLuggageInfo,
                        OutboundAirport = cheapestPriceInLanguage.OutboundAirport,
                        InboundAirport = cheapestPriceInLanguage.InboundAirport,
                        OutboundRouteId = cheapestPriceInLanguage.OutboundRouteId,
                        InboundRouteId = cheapestPriceInLanguage.InboundRouteId,
                        UnitCode = cheapestPriceInLanguage.UnitCode,
                        BoardCode = cheapestPriceInLanguage.BoardCode,
                        PromotionCollections = cheapestPriceInLanguage.PromotionCollections,
                        Prom = cheapestPriceInLanguage.Prom,
                    };
                });

            result[geogCode] = new GeogPricesModel
            {
                NamedSearchPrices = namedSearchItems,
                Summaries = summaries
            };
        }
        return result;

    }

    /// <summary>
    /// Group offers by geography code to build price model(cheapest price for each geography level)
    /// </summary>
    /// <param name="market"></param>
    /// <param name="result">Result dictionary</param>
    /// <param name="namedSearch">Named search</param>
    /// <param name="range"></param>
    /// <param name="offers">Collection of offers</param>
    /// <param name="geogLevelFunc">Function to get geography code</param>
    /// <param name="processChildren">Function to process child items (you may use recursion to process as many levels as you need)</param>
    public void GroupOffersByGeogLevel(MarketInfo market,
        Dictionary<string, Dictionary<string, LivePriceModel>> result,
        NamedSearch namedSearch,
        DateRange range,
        IList<Offer> offers,
        Func<Offer, string> geogLevelFunc,
        Action<List<Offer>> processChildren)
    {
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(namedSearch);
        ArgumentNullException.ThrowIfNull(market);

        var groupedByGeog = offers.GroupBy(geogLevelFunc).ToDictionary(x => x.Key, y => y.ToList());

        foreach (var group in groupedByGeog)
        {
            var cheapestPrice = group.Value.OrderBy(x => x.Price).FirstOrDefault();

            if (!result.TryGetValue(group.Key, out var item))
            {
                item = new Dictionary<string, LivePriceModel>();
            }

            var outboundFlight = cheapestPrice?.Transport.OutboundFlight;
            var returnFlight = cheapestPrice?.Transport.ReturnFlight;
            var unit = cheapestPrice.FirstUnit();
            item[namedSearch.Id] = new LivePriceModel
            {
                PackageId = cheapestPrice?.Accom.PackageId,
                Geog = group.Key,
                SearchCriteria = SearchCriteria.WithOfferDetails(namedSearch, range, cheapestPrice?.Date, outboundFlight?.DepPt),
                Price = cheapestPrice?.Price ?? 0,
                PricePP = cheapestPrice?.PricePP ?? 0,
                TouristTax = cheapestPrice?.TouristTax ?? 0,
                TouristTaxPP = cheapestPrice?.TouristTaxPP ?? 0,
                PriceExcludingTouristTax = (cheapestPrice?.Price - cheapestPrice?.TouristTax) ?? 0,
                PricePPExcludingTouristTax = (cheapestPrice?.PricePP - cheapestPrice?.TouristTaxPP) ?? 0,
                TaxesAndFees = cheapestPrice?.TaxesAndFees?.Count > 0 ? cheapestPrice.TaxesAndFees.Select(x => new KeyValuePair<string, TaxesAndFeesSummary>(x.Key, new TaxesAndFeesSummary
                {
                    TotalLocalPrice = x.Value.TotalLocalPrice,
                    TotalLocalPricePP = x.Value.TotalLocalPricePP,
                    Currency = x.Value.Currency,
                    ExchRt = x.Value.ExchRt,
                })).ToDictionary(x => x.Key, x => x.Value) : null,
                Currency = market.Currency,
                Market = market.MarketCode,
                Language = namedSearch.Language,
                Transfers = cheapestPrice?.Transfers,
                AccomCode = cheapestPrice?.Accom.Code,
                // Only require extra luggage info at lowest level / hotel level
                ExtraLuggageInfo = processChildren is null ? cheapestPrice?.ExtraLuggageInfo : null,
                OutboundAirport = outboundFlight?.DepPt,
                InboundAirport = returnFlight?.DepPt,
                OutboundRouteId = outboundFlight?.Id,
                InboundRouteId = returnFlight?.Id,
                UnitCode = unit?.Code,
                BoardCode = unit?.Board,
                PromotionCollections = cheapestPrice?.PromotionCollections,
                Prom = cheapestPrice?.Accom.Prom,
            };

            result[group.Key] = item;

            processChildren?.Invoke(group.Value);
        }
    }
}