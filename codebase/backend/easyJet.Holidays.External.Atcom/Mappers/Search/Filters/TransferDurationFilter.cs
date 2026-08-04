using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters;

/// <summary>
/// Filters offers by transfer duration
/// </summary>
public class TransferDurationFilter : IFilter
{
    /// <summary>
    /// Filter offers by max transfer duration when provided.
    /// </summary>
    public Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
    {
        ArgumentNullException.ThrowIfNull(offers);
        ArgumentNullException.ThrowIfNull(request);

        if ((request.MaxTransferDuration is null && request.MinTransferDuration is null))
            return Task.FromResult(offers);

        var minTransferDuration = request.MinTransferDuration ?? int.MinValue;
        var maxTransferDuration = request.MaxTransferDuration ?? int.MaxValue;

        var result = new List<AvCacheResultOffersOfferExtended>();

        foreach (var offer in offers)
        {
            var transferDuration = offer.TransferDuration ?? 0;
            if (transferDuration >= minTransferDuration && transferDuration <= maxTransferDuration)
                result.Add(offer);
        }


        return Task.FromResult(result);
    }

    /// <inheritdoc/>
    public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
    {
        ArgumentNullException.ThrowIfNull(offers);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(applyAllOtherFilters);

        if (offers.Count == 0)
        {
            return FilterOptions.Empty;
        }

        offers = await applyAllOtherFilters(offers, request);

        if (offers.Count == 0)
        {
            return FilterOptions.Empty;
        }

        int? minTransferDuration = null;
        int? maxTransferDuration = null;
        var count = 0;

        foreach (var offer in offers)
        {
            var transferDuration = offer.TransferDuration ?? 0;

            if (transferDuration == 0) continue;

            ++count;

            if (minTransferDuration == null || transferDuration < minTransferDuration)
                minTransferDuration = transferDuration;

            if (maxTransferDuration == null || transferDuration > maxTransferDuration)
                maxTransferDuration = transferDuration;
        }

        if (count == 0)
        {
            return FilterOptions.Empty;
        }

        return new FilterOptions
        {
            Options = [new() { Count = count, MinTransferDuration = minTransferDuration, MaxTransferDuration = maxTransferDuration }]
        };
    }
}

