using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Models;

/// <summary>
/// OffersBucket
/// </summary>
public class OffersBucket
{
    public DateRange Range { get; set; }

    /// <summary>
    /// Offers for this range
    /// </summary>
    public IList<Offer> Offers { get; init; }
}
