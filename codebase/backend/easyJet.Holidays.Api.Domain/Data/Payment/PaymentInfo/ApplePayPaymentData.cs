using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment;

/// <summary>
/// Apple Pay Token Payment Data
/// </summary>
public class ApplePayPaymentData
{
    /// <summary>
    /// Apple Pay Token data
    /// </summary>
    [DataMember(Name = "data")]
    [JsonProperty("data")]
    public string Data { get; set; }
    
    /// <summary>
    /// Apple Pay Token Signature
    /// </summary>
    [DataMember(Name = "signature")]
    [JsonProperty("signature")]
    public string Signature { get; set; }
    
    /// <summary>
    /// Apple Pay Token Header
    /// </summary>
    [DataMember(Name = "header")]
    [JsonProperty("header")]
    public ApplePayPaymentDataHeader Header { get; set; }
    
    /// <summary>
    /// Apple Pay Token Version
    /// </summary>
    [DataMember(Name = "version")]
    [JsonProperty("version")]
    public string Version { get; set; }
}


