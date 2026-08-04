using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment;

/// <summary>
/// Apple Pay Token headers
/// </summary>
public class ApplePayPaymentDataHeader 
{
    /// <summary>
    /// Apple Pay Token Public Key Hash
    /// </summary>
    [DataMember(Name = "publicKeyHash")]
    [JsonProperty("publicKeyHash")]
    public string PublicKeyHash { get; set; }
    
    /// <summary>
    /// Apple Pay Token Ephemeral Public Key
    /// </summary>
    [DataMember(Name = "ephemeralPublicKey")]
    [JsonProperty("ephemeralPublicKey")]
    public string EphemeralPublicKey { get; set; }
    
    /// <summary>
    /// Apple Pay Token transaction id
    /// </summary>
    [DataMember(Name = "transactionId")]
    [JsonProperty("transactionId")]
    public string TransactionId { get; set; }
}
