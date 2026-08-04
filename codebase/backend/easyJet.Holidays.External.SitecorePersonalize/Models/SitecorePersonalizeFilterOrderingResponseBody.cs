using System.Runtime.Serialization;

namespace easyJet.Holidays.External.SitecorePersonalize.Models;

/// <summary>
/// Sitecore personalize response body
/// </summary>
[Serializable]
[DataContract]
public class SitecorePersonalizeFilterOrderingResponseBody
{
    /// <summary>
    /// Attribute
    /// </summary>
    [DataMember(Name ="filterOrder")]
    public string FilterOrder { get; set; }
}