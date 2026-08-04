using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment;

/// <summary>
/// Apple Pay payment info with specific properties
/// </summary>
public class ApplePayPaymentInfo : PaymentInfo
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public ApplePayPaymentInfo()
    {
        PaymentType = PaymentType.ApplePay;
    }
    
    /// <summary>
    /// Apple Pay Token
    /// </summary>
    [DataMember(Name = "token")]
    public ApplePayToken Token { get; set; }
    
    /// <summary>
    /// Determines whether any Apple Pay token-related fields differ from their default values.
    /// </summary>
    public override bool ValidateByDefaultValue()
    {
        return base.ValidateByDefaultValue() ||
               Token != null;
    }
}