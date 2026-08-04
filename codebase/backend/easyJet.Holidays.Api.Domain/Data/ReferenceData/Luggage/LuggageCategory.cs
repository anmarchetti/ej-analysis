using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;

/// <summary>
/// Category of Luggage Items.
/// </summary>
[Serializable]
public class LuggageCategory
{
    /// <summary>
    /// Atcom Code of the Luggage Category
    /// </summary>
    [JsonProperty(nameof(Code))]
    public string Code { get; set; }

    /// <summary>
    /// Name of the Luggage Category
    /// </summary>
    [JsonProperty(nameof(Name))]
    public string Name { get; set; }

    /// <summary>
    /// Type of the Luggage Category
    /// </summary>
    [JsonProperty(nameof(Type))]
    public string Type { get; set; }

    /// <summary>
    /// All Luggage Items in this Category
    /// </summary>
    [JsonProperty("Children")]
    public IReadOnlyCollection<LuggageItemBase> LuggageItems { get; set; }
}