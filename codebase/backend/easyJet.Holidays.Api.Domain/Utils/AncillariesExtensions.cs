using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Extensions;
using System.Globalization;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Utils;

/// <summary>
/// Extensions for Ancillaries logic.
/// </summary>
public static class AncillariesExtensions
{
    /// <summary>
    /// Builds a list of guests from an Package.
    /// </summary>
    public static IEnumerable<PersonWithDetails> BuildGuests(this BookingPackage package)
    {
        var rooms = package?.Accom?.Rooms;
        if (rooms == null)
            return Array.Empty<PersonWithDetails>();

        var occupations = rooms.Select(x => x.Occupation).ToArray();
        var mergedOccupation = MergeOccupations(occupations);
        var guests = mergedOccupation.BuildGuests();

        return guests;
    }

    /// <summary>
    /// Builds a list of guests from an Offer.
    /// </summary>
    public static IEnumerable<PersonWithDetails> BuildGuests(this Offer offer)
    {
        var rooms = offer?.Accom?.Unit;
        if (rooms == null)
            return Array.Empty<PersonWithDetails>();

        var occupations = rooms.Select(x => x.Occupation).ToArray();
        var mergedOccupation = MergeOccupations(occupations);
        var guests = mergedOccupation.BuildGuests();

        return guests;
    }

    /// <summary>
    /// Merge multiple occupations into one.
    /// </summary>
    private static Occupation MergeOccupations(Occupation[] occupations)
    {
        return new Occupation
        {
            Adults = occupations.Sum(o => o.Adults),
            Children = occupations.Sum(o => o.Children),
            Infants = occupations.Sum(o => o.Infants)
        };
    }

    /// <summary>
    /// Builds a list of guests from the accomodation unit.
    /// </summary>
    /// <param name="occupation">Unit/room occupation.</param>
    /// <returns>Sequence of PersonWithDetails</returns>
    private static IEnumerable<PersonWithDetails> BuildGuests(this Occupation occupation)
    {
        const int index = 1;

        if (occupation is null)
            yield break;

        for (int i = 0; i < occupation.Adults; i++)
            yield return BuildPerson(PersonType.Adult, i + index);

        for (int i = 0; i < occupation.Children; i++)
            yield return BuildPerson(PersonType.Child, i + index + occupation.Adults);

        for (int i = 0; i < occupation.Infants; i++)
            yield return BuildPerson(PersonType.Infant, i + index + occupation.Adults + occupation.Children);

        PersonWithDetails BuildPerson(PersonType type, int index)
        {
            return new PersonWithDetails
            {
                Age = CalculateDefaultAge(type),
                Sex = Sex.Unknown,
                Type = type,
                Index = index.ToString()
            };
        }

        int CalculateDefaultAge(PersonType person)
        {
            const int defaultAdultAge = 30;
            const int defaultChildAge = 2;
            const int defaultInfantAge = 0;

            return person switch
            {
                PersonType.Adult => defaultAdultAge,
                PersonType.Child => defaultChildAge,
                PersonType.Infant => defaultInfantAge,
                _ => 0
            };
        }
    }

    /// <summary>
    /// Builds a list of guests from the request.
    /// </summary>
    /// <param name="request">Accommodation offer request from FE.</param>
    /// <returns>Sequence of PersonWithDetails</returns>
    public static IEnumerable<PersonWithDetails> BuildGuests(this BaseSearchRequest request)
    {
        if (request.Room.IsNullOrEmpty())
            yield break;

        foreach (var room in request.Room)
        {
            for (var i = 1; i <= room.Adults; i++)
                yield return BuildPerson(PersonType.Adult, i);

            for (var i = 1; i <= room.Children; i++)
                yield return BuildPerson(PersonType.Child, i + room.Adults);

            for (var i = 1; i <= room.Infants; i++)
                yield return BuildPerson(PersonType.Infant, i + room.Adults + room.Children);
        }

        PersonWithDetails BuildPerson(PersonType type, int index)
        {
            return new PersonWithDetails
            {
                Age = CalculateDefaultAge(type),
                Sex = Sex.Unknown,
                Type = type,
                Index = index.ToString()
            };
        }

        int CalculateDefaultAge(PersonType person)
        {
            const int defaultAdultAge = 30;
            const int defaultChildAge = 2;
            const int defaultInfantAge = 0;

            return person switch
            {
                PersonType.Adult => defaultAdultAge,
                PersonType.Child => defaultChildAge,
                PersonType.Infant => defaultInfantAge,
                _ => 0
            };
        }
    }

    private static readonly Regex LuggageParseRegex = new(@"(?<Code>\w+)-(?<Quantity>\d+)", RegexOptions.Compiled, TimeSpan.FromSeconds(5));

    /// <summary>
    /// Parse luggage query from the accommodation request.
    /// </summary>
    /// <param name="request">Accommodation request.</param>
    /// <returns>Code and Person tuple.</returns>
    /// <exception cref="ArgumentNullException">When luggage query is null.</exception>
    /// <exception cref="FormatException">When luggage query has bad format.</exception>
    public static IEnumerable<(string code, PersonType person)> ParseLuggage(this AccommodationOfferRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.Luggage.IsNullOrEmpty())
            return Enumerable.Empty<(string code, PersonType person)>();

        return ParseLuggageIterator(request);
    }

    private static IEnumerable<(string code, PersonType person)> ParseLuggageIterator(AccommodationOfferRequest request)
    {
        foreach ((string code, int quantity) in ParseLuggageByIndex(request, 0))
            for (int i = 0; i < quantity; i++)
                yield return (code, PersonType.Adult);

        foreach ((string code, int quantity) in ParseLuggageByIndex(request, 1))
            for (int i = 0; i < quantity; i++)
                yield return (code, PersonType.Child);

        foreach ((string code, int quantity) in ParseLuggageByIndex(request, 2))
            for (int i = 0; i < quantity; i++)
                yield return (code, PersonType.Infant);
    }

    private static IEnumerable<(string code, int quantity)> ParseLuggageByIndex(AccommodationOfferRequest request, int index)
    {
        const char luggageQuerySplitter = '|';
        if (request.Luggage.Count < index + 1)
            yield break;
        var luggageQuery = request.Luggage.Skip(index).First();
        if (string.IsNullOrEmpty(luggageQuery))
            yield break;
        var luggageList = luggageQuery.Split(luggageQuerySplitter);
        foreach (var luggage in luggageList)
            yield return ParseLuggageQuery(luggage);
    }

    private static (string code, int quantity) ParseLuggageQuery(string query)
    {
        ArgumentNullException.ThrowIfNull(query);
            
        var match = LuggageParseRegex.Match(query.ToUpper(CultureInfo.InvariantCulture));
        if (!match.Success)
            throw new FormatException($"Invalid format for luggage: {query}");

        var code = match.Groups["Code"].Value;
        var quantity = int.Parse(match.Groups["Quantity"].Value, CultureInfo.InvariantCulture);

        return (code, quantity);
    }
}