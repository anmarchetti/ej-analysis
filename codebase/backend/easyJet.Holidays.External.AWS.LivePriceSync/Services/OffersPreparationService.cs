using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Services;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

/// <inheritdoc cref="IOffersPreparationService"/> />
public class OffersPreparationService : IOffersPreparationService
{
    private readonly IOffersMapper _offersMapper;
    private readonly ILuggageOfferService _luggageOfferService;
    private readonly IPromotionCollectionsService _promotionCollectionsService;
    private readonly MarketSettings _marketSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    public OffersPreparationService(
        IOffersMapper offersMapper,
        ILuggageOfferService luggageOfferService,
        IPromotionCollectionsService promotionCollectionsService,
        IOptions<MarketSettings> marketOptions)
    {
        _offersMapper = offersMapper;
        _luggageOfferService = luggageOfferService;
        _promotionCollectionsService = promotionCollectionsService;

        ArgumentNullException.ThrowIfNull(marketOptions);
        _marketSettings = marketOptions.Value;
    }

    /// <inheritdoc />
    public async Task<List<Offer>> MapAndEnrichOffers(List<AvCacheResultOffersOffer> offers, string[] sponsoredHotels)
    {
        var mappedOffers = await _offersMapper.ConvertOffers(offers, [], _marketSettings);

        await _luggageOfferService.EnrichOffersWithComplimentaryLuggage(mappedOffers);

        await _promotionCollectionsService.EnrichWithPromotionCollectionsAsync(mappedOffers);

        return mappedOffers;
    }
}