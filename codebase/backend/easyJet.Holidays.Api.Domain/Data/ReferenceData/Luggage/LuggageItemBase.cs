using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;

/// <summary>
/// Base Luggage Item class that contains common properties for luggage items.
/// </summary>
public abstract class LuggageItemBase
{
    /// <summary>
    /// Name of the luggage item.
    /// </summary>
    [JsonProperty(nameof(Name))]
    public string Name { get; set; }

    /// <summary>
    /// Description of the luggage item.
    /// </summary>
    [JsonProperty(nameof(Description))]
    [DataMember]
    public string Description { get; set; }

    /// <summary>
    /// Icon URL for the luggage item.
    /// </summary>
    [JsonProperty(nameof(Icon))]
    [DataMember]
    public string Icon { get; set; }

    /// <summary>
    /// Indicates if the luggage item is enabled.
    /// </summary>
    [JsonProperty(nameof(IsLuggageItemEnabled))]
    [DataMember]
    public bool IsLuggageItemEnabled { get; set; }

    /// <summary>
    /// Code of the luggage item.
    /// </summary>
    [JsonProperty(nameof(Code))]
    [DataMember]
    public virtual string Code { get; set; }
}
