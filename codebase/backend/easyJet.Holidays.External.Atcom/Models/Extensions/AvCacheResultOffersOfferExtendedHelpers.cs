using easyJet.Holidays.External.Atcom.Models.Internal.Search;

namespace easyJet.Holidays.External.Atcom.Models.Extensions;

internal static class AvCacheResultOffersOfferExtendedHelpers
{
    public static decimal GetPayLocalEst(AvCacheResultOffersOffer offer)
    {
        if (offer.PayLocalEst == 0 && offer.PayLocal == 0)
        {
            return offer.PayLocalEst;
        }

        if (offer.PayLocalEst == 0 && offer.PayLocal > 0)
        {
            return offer.PayLocal;
        }

        if (offer.PayLocalEst > 0 && offer.PayLocal == 0)
        {
            return offer.PayLocalEst;
        }

        return 0;
    }

    /// <summary>
    /// Calculates the tax amount per person considering only paying customers for offer.
    /// </summary>
    /// <returns>The tax amount per person.</returns>
    public static decimal GetPayLocalEstPP(AvCacheResultOffersOffer offer)
    {
        if(offer.Accom == null || offer.Accom.Length == 0)
        {
            return 0;
        }
        
        var payingCustomersCount = PayingCustomersCount(offer);

        if (payingCustomersCount > 0)
        {
            return GetPayLocalEst(offer) / payingCustomersCount;
        }
        
        return offer.Accom.Where(a => a is {Unit: not null})
            .SelectMany(a => a.Unit)
            .Where(u => u is {PriceDetail.PriceElement: not null})
            .SelectMany(u => u.PriceDetail.PriceElement).Where(pe => pe != null)
            .Sum(pe => pe.ConvPricePP);
    }

    /// <summary>
    /// Total paying customers count. Adults and Children excluding free child places.
    /// </summary>
    public static int PayingCustomersCount(AvCacheResultOffersOffer offer)
    {
        if(offer?.Accom == null || offer.Accom.Length == 0)
        {
            return 0;
        }

        var adults =
            offer.Accom.Sum(a => a.Unit?.Sum(u => u?.Occ?.Ad ?? 0) ?? 0);

        var children =
            offer.Accom.Sum(a => a.Unit?.Sum(u => u?.Occ?.Ch ?? 0) ?? 0);

        var freeChildPlaces =
            offer.Accom.Sum(a => a.Unit?.Sum(u => u is {DcSpecified: true, Dc: YesNo.Y} ? 1 : 0) ?? 0);

        return adults + children - freeChildPlaces;
    }

    /// <summary>
    /// Calculates the price excluding the tourist tax for the given offer.
    /// </summary>
    /// <param name="offer">The offer from which the price excluding tourist tax is calculated.</param>
    /// <returns>The price after deducting the tourist tax.</returns>
    public static decimal GetPriceExcludingTouristTax(AvCacheResultOffersOffer offer) => offer.Price - GetPayLocalEst(offer);

    /// <summary>
    /// Calculates the price per person excluding the estimated local tourist tax from the total price.
    /// </summary>
    /// <param name="offer">The offer object containing pricing and customer details.</param>
    /// <returns>The price per person excluding the tourist tax.</returns>
    public static decimal GetPricePPExcludingTouristTax(AvCacheResultOffersOffer offer)
    {
        var payingCustomersCount = PayingCustomersCount(offer);

        return payingCustomersCount > 0
            ? offer.PricePP - (GetPayLocalEst(offer) / payingCustomersCount)
            : offer.PricePP;
    }
}