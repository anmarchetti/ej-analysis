using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.AWS.LivePriceSync.Models;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

/// <summary>
/// 
/// </summary>
public interface ILivePriceAggregationService
{
    /// <summary>
    /// Group offers by geography levels(country, location, resort, accommodation)
    /// </summary>
    /// <param name="market"></param>
    /// <param name="namedSearchOffers"></param>
    /// <param name="exceptionsDuringAggregation"></param>
    /// <returns>Map: key is geography code, value is price model</returns>
    Dictionary<string, GeogPricesModel> AggregateOffers(MarketInfo market,
        Dictionary<NamedSearch, List<OffersBucket>> namedSearchOffers,
        IList<(NamedSearch Search, Exception Exc)> exceptionsDuringAggregation);

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
    void GroupOffersByGeogLevel(MarketInfo market,
        Dictionary<string, Dictionary<string, LivePriceModel>> result,
        NamedSearch namedSearch,
        DateRange range,
        IList<Offer> offers,
        Func<Offer, string> geogLevelFunc,
        Action<List<Offer>> processChildren);
}