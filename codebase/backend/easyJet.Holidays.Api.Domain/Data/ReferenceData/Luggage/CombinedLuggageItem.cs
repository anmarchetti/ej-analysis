using easyJet.Holidays.Api.Domain.Utils;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;

/// <summary>
/// A Luggage Item which was created out of other luggage items. Like 23 KG and 3 KG => 26 KG
/// </summary>
[Serializable]
[DataContract]
public class CombinedLuggageItem : LuggageItemBase
{
    /// <summary>
    /// A mapping of index and luggage code
    /// </summary>
    [JsonProperty(nameof(Codes))]
#pragma warning disable CA2227
    public List<string> Codes { get; set; }
#pragma warning restore CA2227

    /// <summary>
    /// Code of the Luggage Item
    /// </summary>
    public override string Code => Codes != null && Codes.Count > 0
            ? LuggageUtils.CombineCodes(Codes)
            : string.Empty;
}
