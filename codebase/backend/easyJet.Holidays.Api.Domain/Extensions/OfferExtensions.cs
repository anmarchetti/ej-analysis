using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using Force.DeepCloner;

namespace easyJet.Holidays.Api.Domain.Extensions;

/// <summary>
/// Offer extensions.
/// </summary>
public static class OfferExtensions
{
    /// <summary>
    /// Updates offer with new transfer.
    /// </summary>
    /// <param name="offer">Offer</param>
    /// <param name="transferItem">Transfer information</param>
    /// <returns>Updated offer.</returns>
    public static Offer MergeTransferItem(this Offer offer, TransferItem transferItem)
    {
        var result = offer.DeepClone();
        result.Transfers = new List<TransferItem> { transferItem };

        return result;
    }

    /// <summary>
    /// Adds extra luggage info to offers that are not external.
    /// </summary>
    /// <param name="offers">The list of offers to enrich.</param>
    /// <param name="originalBooking">The original booking containing the extra luggage information.</param>
    /// <returns>The list of enriched offers.</returns>

    public static List<Offer> EnrichWithExtraLuggage(this List<Offer> offers, BookingResponse originalBooking)
    {
        foreach (var offer in offers)
        {
            if (!offer.Transport.Routes.Any(x => x.IsExternal != true))
            {
                offer.ExtraLuggageInfo = originalBooking.ExtraLuggageInfo;
            }
        }

        return offers;
    }

    /// <summary>
    /// Sorts offers based on the original booking's departure point.
    /// </summary>
    /// <param name="offers">The list of offers to sort.</param>
    /// <param name="originalBooking">The original booking used for sorting.</param>
    /// <returns>The sorted list of offers.</returns>
    public static List<Offer> SortOffersByOriginalBooking(this List<Offer> offers, BookingResponse originalBooking)
    {
        var result = new List<Offer>();

        if (offers.IsNullOrEmpty())
        {
            return result;
        }
            
        var groupedOffers = offers
            .GroupBy(offer => offer.Transport.OutboundFlight.DepPt);

        var sameDepPt = groupedOffers
            .Where(x => x.Key.Equals(originalBooking.Package.Transport.OutboundFlight.DepPt, StringComparison.InvariantCultureIgnoreCase))
            .Select(x => SortByDepartureTime(x.ToList(), originalBooking))
            .SelectMany(x => x);

        var differentDepPt = groupedOffers
            .Where(x => !x.Key.Equals(originalBooking.Package.Transport.OutboundFlight.DepPt, StringComparison.InvariantCultureIgnoreCase))
            .Select(x => SortByDepartureTime(x.ToList(), originalBooking))
            .SelectMany(x => x);

        result.AddRange(sameDepPt);
        result.AddRange(differentDepPt);

        return result;
    }

    /// <summary>
    /// Sorts a list of offers by the absolute difference between the departure time of the first route of each offer and the departure time of the outbound flight of the original booking.
    /// </summary>
    /// <param name="offers">The list of offers to sort.</param>
    /// <param name="originalBooking">The original booking used to calculate the difference in departure time.</param>
    /// <returns>A list of offers sorted by the absolute difference in departure time and then by price.</returns>
    public static List<Offer> SortByDepartureTime(this List<Offer> offers, BookingResponse originalBooking)

    {
        var result = offers
            .OrderBy(offer => Math.Abs((offer.Transport.Routes[0].DepDate?.TimeOfDay ?? TimeSpan.Zero).Ticks -
                     (originalBooking.Package.Transport.OutboundFlight.DepDate?.TimeOfDay ?? TimeSpan.Zero).Ticks))
            .ThenBy(offer => offer.Price)
            .ToList();

        return result;
    }

    /// <summary>
    /// Sorts a list of offers by price in ascending order.
    /// </summary>
    /// <param name="offers">The list of offers.</param>
    /// <returns>A list of offers sorted by price, or an empty list if the input list is null or empty.</returns>
    public static List<Offer> SortByPrice(this List<Offer> offers)
    {
        if (offers.IsNullOrEmpty())
        {
            return new List<Offer>();
        }

        return offers
            .OrderBy(offer => offer.Price)
            .ToList();
    }

    /// <summary>
    /// Paginates a list of offers.
    /// </summary>
    /// <param name="offers">The list of items to paginate.</param>
    /// <param name="page">The page number to return. Page numbers start at 1.</param>
    /// <param name="take">The number of items per page.</param>
    /// <returns>A paginated list of offers or an empty collection if the input list is null or empty.</returns>
    public static IEnumerable<Offer> Paginate(this IEnumerable<Offer> offers, int page, int take)
    {
        if (offers.IsNullOrEmpty())
        {
            return Enumerable.Empty<Offer>();
        }

        return offers
            .Skip((page - 1) * take)
            .Take(take);
    }
}