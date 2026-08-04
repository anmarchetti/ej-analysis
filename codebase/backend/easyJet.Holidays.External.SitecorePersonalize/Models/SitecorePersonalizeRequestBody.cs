using System.Runtime.Serialization;

namespace easyJet.Holidays.External.SitecorePersonalize.Models;

/// <summary>
/// Sitecore personalize request body
/// </summary>
[Serializable]
[DataContract]
public class SitecorePersonalizeRequestBody
{
    /// <summary>
    /// Client Key
    /// </summary>
    [DataMember(Name ="clientKey")]
    public string ClientKey { get; set; }

    /// <summary>
    /// Channel
    /// </summary>
    [DataMember(Name ="channel")]
    public string Channel { get; set; }

    /// <summary>
    /// Language 
    /// </summary>
    [DataMember(Name ="language")]
    public string Language { get; set; }

    /// <summary>
    /// Currency
    /// </summary>
    [DataMember(Name ="currencyCode")]
    public string CurrencyCode { get; set; }

    /// <summary>
    /// Point of sale
    /// </summary>
    [DataMember(Name ="pointOfSale")]
    public string PointOfSale { get; set; }

    /// <summary>
    /// Email
    /// </summary>
    [DataMember(Name ="email")]
    public string Email { get; set; }

    /// <summary>
    /// Browser Id
    /// </summary>
    [DataMember(Name ="browserId")]
    public string BrowserId { get; set; }

    /// <summary>
    /// Friendly Id
    /// </summary>
    [DataMember(Name ="friendlyId")]
    public string FriendlyId { get; set; }

    /// <summary>
    /// Custom Parameters
    /// </summary>
    [DataMember(Name ="params")]
    public Dictionary<string, object> CustomParameters { get; set; } = new Dictionary<string, object>();

}