using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment;

/// <summary>
/// Apple Pay Token class
/// </summary>
public class ApplePayToken
{
    /// <summary>
    /// Apple Pay Token Payment Data
    /// </summary>
    [DataMember(Name = "paymentData")]
    public ApplePayPaymentData PaymentData { get; set; }
    
    /// <summary>
    /// Apple Pay Token (card details)
    /// </summary>
    [DataMember(Name = "paymentMethod")]
    public ApplePayPaymentMethod PaymentMethod { get; set; }
    
    /// <summary>
    /// Apple Pay Token Transaction Identifier
    /// </summary>
    [DataMember(Name = "transactionIdentifier")]
    public string TransactionIdentifier { get; set; }
}
