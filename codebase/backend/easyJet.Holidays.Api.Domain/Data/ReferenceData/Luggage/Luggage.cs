using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;

/// <summary>
/// The luggage class contains all luggage categories.
/// </summary>
public class Luggage
{
    /// <summary>
    /// All Luggage Categories
    /// </summary>
    [JsonProperty(nameof(LuggageCategories))]
    public IReadOnlyCollection<LuggageCategory> LuggageCategories { get; set; }
}