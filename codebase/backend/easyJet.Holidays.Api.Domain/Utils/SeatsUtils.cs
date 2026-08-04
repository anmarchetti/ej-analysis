using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;

namespace easyJet.Holidays.Api.Domain.Utils;

/// <summary>
/// Helper methods for seat selection
/// </summary>
public static class SeatsUtils
{
    /// <summary>
    /// Checks if seats selection is used.
    /// </summary>
    /// <param name="seatSelection">Seat selection collection.</param>
    public static bool HasSelectedSeats(IList<SeatMap> seatSelection)
    {
        if (seatSelection.IsNullOrEmpty())
        {
            return false;
        }

        return seatSelection.Any(seatMap => seatMap.Seats?.Any() ?? false);
    }

    /// <summary>
    /// Gets seats prices.
    /// </summary>
    /// <param name="seatSelection">Seat selection collection.</param>
    public static decimal GetSeatsPrice(IList<SeatMap> seatSelection)
    {
        return seatSelection?.Sum(seatMap => seatMap.Seats?.Sum(seat => seat.Price) ?? 0m) ?? 0m;
    }

    /// <summary>
    /// Gets seats price per person.
    /// </summary>
    /// <param name="seatSelection">Seat selection collection.</param>
    /// <param name="guests">Guest collection.</param>
    public static decimal GetSeatsPricePerPerson(IList<SeatMap> seatSelection, IList<PersonWithDetails> guests)
    {
        var nonInfantsCount = GuestUtils.GetNonInfantsCount(guests);
        return GetSeatsPrice(seatSelection) / Math.Max(1, nonInfantsCount);
    }

    /// <summary>
    /// Gets seats price per person.
    /// </summary>
    /// <param name="seatSelection">Seat selection collection.</param>
    /// <param name="unit">Unit</param>
    public static decimal GetSeatsPricePerPerson(IList<SeatMap> seatSelection, IList<Unit> unit)
    {
        var nonInfantsCount = unit?.Sum(unit => unit.Occupation.Adults + unit.Occupation.Children) ?? 0;
        return GetSeatsPrice(seatSelection) / Math.Max(1, nonInfantsCount);
    }
}