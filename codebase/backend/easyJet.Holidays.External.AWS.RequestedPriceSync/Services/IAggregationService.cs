using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Models;
using System.Collections.Concurrent;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services;

/// <summary>
/// provides utility for offers
/// </summary>
public interface IAggregationService
{
    /// <summary>
    /// aggregates offers
    /// </summary>
    /// <returns></returns>
    Dictionary<string, PricesModel> AggregateOffers(
        IDictionary<RequestedPriceNamedSearch, List<OffersBucket>> namedSearchOffers,
        ConcurrentQueue<(RequestedPriceNamedSearch config, Exception exception)> exceptionCollection,
        bool includeHotelLevel = false,
        int degreeOfParallelization = 1);
}