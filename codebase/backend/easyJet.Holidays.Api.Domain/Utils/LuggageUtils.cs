using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Luggage;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Extensions;

namespace easyJet.Holidays.Api.Domain.Utils;

/// <summary>
/// Helper methods for luggage
/// </summary>
public static class LuggageUtils
{
    private const string Separator = "_";

    /// <summary>
    /// Returns total cost of all extra luggage
    /// </summary>
    public static decimal GetLuggagePrice(ExtraLuggageInfo luggageInfo)
    {
        decimal result = 0;
        if (luggageInfo?.Items.IsNullOrEmpty() ?? true)
        {
            return result;
        }

        foreach (var luggageItem in luggageInfo.Items)
        {
            if (luggageItem.Quantity <= 0 || luggageItem.IsComplimentary)
                continue;

            result += luggageItem.Quantity * (decimal)luggageItem.Price;
        }

        return result;
    }

    /// <summary>
    /// Returns a sum of all luggage prices per person
    /// </summary>
    public static decimal GetLuggagePricePerPerson(ExtraLuggageInfo luggageInfo, IList<PersonWithDetails> guests)
    {
        var nonInfantsCount = GuestUtils.GetNonInfantsCount(guests);
        return GetLuggagePrice(luggageInfo) / Math.Max(1, nonInfantsCount);
    }

    /// <summary>
    /// Returns all luggage category of given LuggageType
    /// </summary>
    public static IEnumerable<LuggageCategory> GetLuggageCategoryByType(List<LuggageCategory> luggageCategories, LuggageType luggageType)
    {
        if (luggageCategories.IsNullOrEmpty())
        {
            return Enumerable.Empty<LuggageCategory>();
        }

        return luggageCategories.Where(x => CheckLuggageType(x.Type, luggageType));
    }

    /// <summary>
    /// Checks whether luggageType is parsed to LuggateType
    /// </summary>
    public static bool CheckLuggageType(string luggageType, LuggageType type)
    {
        var categoryTypeWithoutWhitespace = luggageType?.Replace(" ", "");

        if (Enum.TryParse(categoryTypeWithoutWhitespace, true, out LuggageType categoryType))
        {
            return categoryType == type;
        }

        return false;
    }

    /// <summary>
    /// Combine codes
    /// </summary>
    /// <param name="codes"></param>
    /// <returns></returns>
    public static string CombineCodes(List<string> codes)
    {
        return string.Join(Separator, codes);
    }

    /// <summary>
    /// Extract codes
    /// </summary>
    /// <param name="code"></param>
    /// <returns></returns>
    public static IReadOnlyCollection<string> ExtractCodes(string code)
    {
        ArgumentNullException.ThrowIfNull(code);
        return code.Split(Separator, StringSplitOptions.RemoveEmptyEntries).ToList();
    }
}