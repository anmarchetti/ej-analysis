using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment;

/// <summary>
/// Apple Pay Token card details
/// </summary>
public class ApplePayPaymentMethod
{
    /// <summary>
    /// Apple Pay customer card display name (brand and last four digits)
    /// </summary>
    [DataMember(Name = "displayName")]
    public string DisplayName { get; set; }
    
    /// <summary>
    /// Apple Pay customer card Network (brand)
    /// </summary>
    [DataMember(Name = "network")]
    public string Network { get; set; }
    
    /// <summary>
    /// Apple Pay customer card Type (credit, debit...)
    /// </summary>
    [DataMember(Name = "type")]
    public string Type { get; set; }
}

