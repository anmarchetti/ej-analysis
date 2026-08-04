using easyJet.Holidays.Api.Domain.Exceptions.Payment;

namespace easyJet.Holidays.External.EI.Models;

/// <summary>
/// ApplePay Card Types
/// </summary>
public static class ApplePayCardType
{
    /// <summary>
    /// ApplePay Visa
    /// </summary>
    private const string ApplePayVisa = "AV";
    
    /// <summary>
    ///  ApplePay Visa Debit
    /// </summary>
    private const string ApplePayVisaDebit = "AL";
   
    /// <summary>
    /// ApplePay MasterCard
    /// </summary>
    private const string ApplePayMasterCard = "AM"; 
    
    /// <summary>
    /// ApplePay Debit MasterCard
    /// </summary>
    private const string ApplePayMasterCardDebit = "AD"; 
    
    /// <summary>
    /// ApplePay American Express
    /// </summary>
    private const string ApplePayAmex = "AA";
    
    /// <summary>
    /// Extracts the ApplePay card type for EI / Payment Gateway based on the network and type.
    /// </summary>
    /// <param name="network">Card Network: Visa,MasterCard,Amex,...</param>
    /// <param name="type">Card Type: Credit,Debit,...</param>
    /// <returns>Encoded Card PaymentType with 2 letters</returns>
    /// <exception cref="InvalidPaymentTypeException"></exception>
    public static string GetApplePayCardType(string network, string type)
    {
        if (string.IsNullOrWhiteSpace(network) || string.IsNullOrWhiteSpace(type))
        {
            throw new InvalidPaymentTypeException("ApplePay Token: card brand or type is empty");
        }
        string cardNetwork = network.ToUpperInvariant();
        string cardType = type.ToUpperInvariant();
        return cardNetwork switch
        {
            "VISA" when cardType == "CREDIT" => ApplePayVisa,
            "VISA" when cardType == "DEBIT" => ApplePayVisaDebit,
            "MASTERCARD" when cardType == "CREDIT" => ApplePayMasterCard,
            "MASTERCARD" when cardType == "DEBIT" => ApplePayMasterCardDebit,
            "AMEX" => ApplePayAmex,
            _ => throw new InvalidPaymentTypeException($"ApplePay Token: card brand not supported: {network} - {type}")
        };
    }
}