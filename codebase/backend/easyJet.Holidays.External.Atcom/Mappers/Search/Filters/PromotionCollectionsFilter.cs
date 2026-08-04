using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Services;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters;

/// <summary>
/// Represents a filter for luxury offers.
/// </summary>
public class PromotionCollectionsFilter : IFilter, IFilterOptionCount
{
    private readonly IPromotionCollectionsService _promotionConfigurationService;

    /// <summary>
    /// 
    /// </summary>
    /// <param name="promotionCollectionsService"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public PromotionCollectionsFilter(IPromotionCollectionsService promotionCollectionsService)
    {
        _promotionConfigurationService = promotionCollectionsService ?? throw new ArgumentNullException(nameof(promotionCollectionsService));
    }

    /// <inheritdoc />
    public async Task Count(IList<AvCacheResultOffersOfferExtended> offers, FilterOptions filterOptions, PackagesSearchRequest request)
    {
        ArgumentNullException.ThrowIfNull(filterOptions);
        
        // Initialize all counts to 0
        foreach (var opt in filterOptions.Options)
        {
            opt.Count = 0;
        }
        
        if (offers == null || offers.Count == 0)
        {
            return;
        }

        var config = await _promotionConfigurationService.GetPromotionConfiguration();
        
        if (config?.Promotions == null || config.Promotions.Count == 0)
        {
            return;
        }
        
        // Process each filter option with matching promotion configuration
        foreach (var opt in filterOptions.Options)
        {
            var matchingPromo = config.Promotions.FirstOrDefault(p => p.Key.Equals(opt.Code, StringComparison.OrdinalIgnoreCase));
            if (matchingPromo == null || string.IsNullOrEmpty(matchingPromo.PromotionCodes))
            {
                continue;
            }
            
            var count = matchingPromo.PromotionCodes
                .Split(',')
                .Select(code => code.Trim())
                .Where(code => !string.IsNullOrEmpty(code))
                .Select(code => offers.Count(f => f.Accom.Any() && f.Accom.First().Prom != null && 
                                                 f.Accom.First().Prom.Equals(code, StringComparison.OrdinalIgnoreCase)))
                .Sum();
            
            opt.Count = count;
        }
    }

    /// <summary>
    /// Filters the list of offers based on luxury criteria.
    /// </summary>
    /// <param name="offers">The list of offers to filter.</param>
    /// <param name="request">The search request containing filter criteria.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the filtered list of offers.</returns>
    public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(offers);

        var promotionCollectionConfiguration = await _promotionConfigurationService.GetPromotionConfiguration();

        if (string.IsNullOrEmpty(request.Promc) || promotionCollectionConfiguration?.Promotions == null)
        { 
            return offers;
        }

        if (promotionCollectionConfiguration.Promotions.Count == 0)
        {
            return offers;
        }

        var promotionKeys = request.Promc.Split(',').Select(c => c.Trim()).ToList();

        var promotionCodes = promotionKeys
            .SelectMany(pk => promotionCollectionConfiguration.Promotions
                .Where(pcc => pcc.Key.Equals(pk, StringComparison.OrdinalIgnoreCase))
                .SelectMany(pcc => !string.IsNullOrEmpty(pcc.PromotionCodes) 
                    ? pcc.PromotionCodes.Split(',').Select(pc => pc.Trim()).Where(pc => !string.IsNullOrEmpty(pc))
                    : Enumerable.Empty<string>())
            .ToList());

        if (promotionCodes.IsNullOrEmpty())
        {
            return offers;
        }
        
        return offers.Where(offer => offer.Accom.Any() && 
                                      offer.Accom.First().Prom != null && 
                                      promotionCodes.Contains(offer.Accom.First().Prom, StringComparer.OrdinalIgnoreCase)).ToList();
    }


    /// <summary>
    /// Gets the filter options for luxury offers.
    /// </summary>
    /// <param name="offers">The list of offers to evaluate.</param>
    /// <param name="request">The search request containing filter criteria.</param>
    /// <param name="applyAllOtherFilters">A function to apply all other filters.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the filter options.</returns>
    public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(offers);
        ArgumentNullException.ThrowIfNull(applyAllOtherFilters);

        if (offers.IsNullOrEmpty())
        {
            return FilterOptions.Empty;
        }

        var filteredOffers = await applyAllOtherFilters(offers, request);
        if (filteredOffers.IsNullOrEmpty())
        {
            return FilterOptions.Empty;
        }
        
        var config = await _promotionConfigurationService.GetPromotionConfiguration();

        if (config?.Promotions == null || config.Promotions.Count == 0)
        {
            return FilterOptions.Empty;
        }

        List<FilterOption> options = new();
        
        foreach (var promoSetting in config.Promotions)
        {
            if (string.IsNullOrEmpty(promoSetting.PromotionCodes))
            {
                continue;
            }
            
            var count = promoSetting.PromotionCodes
                .Split(',')
                .Select(code => code.Trim())
                .Where(code => !string.IsNullOrEmpty(code))
                .Select(code => filteredOffers.Count(f => f.Accom.Any() && 
                                                         f.Accom.First().Prom != null && 
                                                         f.Accom.First().Prom.Equals(code, StringComparison.OrdinalIgnoreCase)))
                .Sum();

            if (count > 0)
            {
                options.Add(new FilterOption
                { 
                    Code = promoSetting.Key, 
                    ShowNewLabel = promoSetting.GetShowNewLabel, 
                    Name = promoSetting.Title, 
                    Count = count,
                    Icon = promoSetting.Icon ?? string.Empty,
                    TooltipText = promoSetting.TooltipText ?? string.Empty,
                    TrackingId = promoSetting.TrackingId
                });
            }
        }

        return options.Count > 0 
            ? new FilterOptions { Options = options } 
            : FilterOptions.Empty;
    }
}