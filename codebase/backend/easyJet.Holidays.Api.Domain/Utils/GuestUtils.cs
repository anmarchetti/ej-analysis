using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Extensions;

namespace easyJet.Holidays.Api.Domain.Utils;

/// <summary>
/// Helper methods for guests-related code
/// </summary>
public static class GuestUtils
{
    /// <summary>
    /// Returns the number of guests with type <see cref="PersonType.Adult"/> or <see cref="PersonType.Child"/>
    /// </summary>
    public static int GetNonInfantsCount<T>(IList<T> guests) where T : Person
    {
        if (guests.IsNullOrEmpty())
        {
            return 0;
        }

        return guests.Count(guest => guest.Type != PersonType.Infant);
    }

    /// <summary>
    /// Indexes guests starting from 1
    /// </summary>
    /// <param name="guests"></param>
    /// <returns></returns>
    public static void IndexGuests(IList<PersonWithDetails> guests)
    {
        if (guests == null)
            return;

        for (var i = 0; i < guests.Count; i++)
        {
            var guest = guests[i];
            guest.Index = (i + 1).ToString();
        }
    }

    /// <summary>
    /// Returns guests with type <see cref="PersonType.Adult"/> or <see cref="PersonType.Child"/>
    /// </summary>
    public static IEnumerable<PersonWithDetails> GetNonInfants(IList<PersonWithDetails> guests)
    {
        if (guests == null)
        {
            yield break;
        }

        foreach (var guest in guests)
        {
            if (guest.Type == PersonType.Infant)
                continue;

            yield return guest;
        }
    }

    /// <summary>
    /// Sorts guests in the right order: adults, children, infants
    /// </summary>
    /// <param name="guests"></param>
    /// <returns></returns>
    public static IList<T> SortGuests<T>(IList<T> guests, Func<T, PersonType> getType)
    {
        return guests?.OrderBy(p =>
        {
            var type = getType(p);
            if (type == PersonType.Adult) return 0;
            if (type == PersonType.Child) return 1;
            return 2;
        }).ToList() ?? new List<T>();
    }
}