namespace easyJet.Holidays.Api.Domain.Settings;

/// <summary>
/// Sitecore personalize settings
/// </summary>
public class SitecorePersonalizeSettings
{
    /// <summary>
    /// User Id Cookie
    /// </summary>
    public string UserIdCookie { get; set; }
    
    /// <summary>
    /// Client Key
    /// </summary>
    public string ClientKey { get; set; }
    
    /// <summary>
    /// Cookie format
    /// </summary>
    public string CookieFormat { get; set; }
    
    /// <summary>
    /// Timeout in milliseconds
    /// </summary>
    public int TimeoutMilliSeconds { get; set; }

    /// <summary>
    /// The host address for the Sitecore personalize service.
    /// </summary>
    public string Host { get; set; }
    
    /// <summary>
    /// Default channel
    /// </summary>
    public string DefaultChannel { get; set; }
    
    /// <summary>
    /// Default point of sale
    /// </summary>
    public string DefaultPointOfSale { get; set; }
    
    /// <summary>
    /// Default attribute result
    /// </summary>
    public string DefaultAttributeResult { get; set; }
    
    /// <summary>
    /// Sitecore Personalize Api Settings
    /// </summary>
    public SitecorePersonalizeApiSettings Api { get; set; }
}

/// <summary>
/// Sitecore Personalize Api Settings
/// </summary>
public class SitecorePersonalizeApiSettings
{
    /// <summary>
    /// Call flows
    /// </summary>
    public string CallFlows { get; set; }
}