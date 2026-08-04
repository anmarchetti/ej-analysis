#nullable enable
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using Newtonsoft.Json;
using System.Collections.ObjectModel;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData;

/// <summary>
/// Promotion Collections from SiteCore.
/// </summary>
public class PromotionCollections
{
    /// <summary>
    /// Gets the list of child promotions.
    /// </summary>
    [JsonProperty("Children")]
    public ReadOnlyCollection<KeyedPromotion>? Promotions { get; set; }

    /// <summary>
    /// Enriches the given offer with promotion collection keys.
    /// </summary>
    /// <param name="offer">The offer to enrich.</param>
    /// <returns>A list of promotion collection keys or null if no matching promotions are found.</returns>
    public IList<string>? EnrichOfferWithCollectionsKeys(Offer offer)
    {
        if (Promotions == null || Promotions.Count == 0)
        {
            return null;
        }
        var filteredChildren = Promotions.Where(c => c.PromotionCodes.Split(",").Any(pc => pc.Equals(offer.Accom.Prom, StringComparison.Ordinal))).ToList();

        if (filteredChildren.Count > 0)
        {
            return filteredChildren.Select(c => c.Key).ToList();
        }
        return null;
    }
    
    /// <summary>
    /// Enriches the given booking response with promotion collection keys.
    /// </summary>
    /// <param name="bookingResponse">The booking response to enrich.</param>
    /// <returns>A list of promotion collection keys or null if no matching promotions are found.</returns>
    public IList<string>? EnrichBookingResponseWithCollectionsKeys(BookingResponse bookingResponse)
    {
        if (Promotions == null || Promotions.Count == 0)
        {
            return null;
        }
        var filteredChildren = Promotions.Where(c => c.PromotionCodes.Split(",").Any(pc => pc.Equals(bookingResponse.Prom, StringComparison.Ordinal))).ToList();

        if (filteredChildren.Count > 0)
        {
            return filteredChildren.Select(c => c.Key).ToList();
        }
        return null;
    }
}

#nullable disable

/// <summary>
/// A Promotion.
/// </summary>
/// <param name="Key"></param>
/// <param name="PromotionCodes"></param>
/// <param name="ShowNewLabel"></param>
/// <param name="Title"></param>
/// <param name="TooltipText"></param>
/// <param name="Icon"></param>
/// <param name="TrackingId"></param>
public record KeyedPromotion(string Key, string PromotionCodes, string ShowNewLabel, string Title, string TooltipText, string Icon, string TrackingId)
{
    /// <summary>
    /// Indicates whether the "New" label should be shown.
    /// </summary>
    public bool GetShowNewLabel => !string.IsNullOrEmpty(ShowNewLabel) && int.Parse(ShowNewLabel, CultureInfo.InvariantCulture) == 1;
}
