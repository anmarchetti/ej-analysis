using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment;

/// <summary>
/// Card payment info with specific properties
/// </summary>
public class CardPaymentInfo : PaymentInfo
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public CardPaymentInfo()
    {
        PaymentType = PaymentType.CreditDebitCard;
    }
    
    
    /// <summary>
    /// Credit or Debit card number
    /// </summary>
    [DataMember(Name = "cardNumber")]
    [JsonProperty("cardNumber")]
    public string CardNumber { get; set; }

    /// <summary>
    /// Name on card
    /// </summary>
    [DataMember(Name = "nameOnCard")]
    [Display(Name = "Name on card")]
    [MaxLength(40, ErrorMessage = "The field {0} should be less then 40")]
    public string NameOnCard { get; set; }

    /// <summary>
    /// Card expiration date
    /// </summary>
    [DataMember(Name = "expirationDate")]
    [Display(Name = "Expiration Date")]
    [RegularExpression("[0-9]{2}/[0-9]{2}", ErrorMessage = "The field {0} should be a valid Month / Year combination")]
    public string ExpirationDate { get; set; }

    /// <summary>
    /// Card security code
    /// </summary>
    [DataMember(Name = "cvv")]
    [JsonProperty("cvv")]
    public string CVV { get; set; }

    /// <summary>
    /// Card issue code
    /// </summary>
    [DataMember(Name = "issueNumber")]
    public string IssueNumber { get; set; }

    /// <summary>
    /// 3DS server transaction ID
    /// </summary>
    [DataMember(Name = "threeDSServerTransID")]
    public string ThreeDSServerTransID { get; set; }

    /// <summary>
    /// Payment transaction reference
    /// </summary>
    [DataMember(Name = "transactionReference")]
    public string TransactionReference { get; set; }

    /// <summary>
    /// 3DS transaction status
    /// </summary>
    [DataMember(Name = "transStatus")]
    public string TransStatus { get; set; }

    /// <summary>
    /// Whether the 3DS challenge is completed or not 
    /// </summary>
    [DataMember(Name = "challengeComplete")]
    public bool ChallengeComplete { get; set; }

    /// <summary>
    /// Whether 3DS2 challenge step had error
    /// </summary>
    [DataMember(Name = "challengeError")]
    public bool ChallengeError { get; set; }

    /// <summary>
    /// Whether 3DS2 fingerprint step had error
    /// </summary>
    [DataMember(Name = "fingerprintError")]
    public bool FingerprintError { get; set; }

    /// <summary>
    /// Whether 3DS2 fingerprint step didn't get callback in time
    /// </summary>
    [DataMember(Name = "fingerprintTimeout")]
    public bool FingerprintTimeout { get; set; }

    /// <summary>
    /// Whether 3DS1 authentication step had error
    /// </summary>
    [DataMember(Name = "authenticationError")]
    public bool AuthenticationError { get; set; }

    /// <summary>
    /// Encryption value that has to be sent to the Issuer
    /// </summary>
    [DataMember(Name = "md")]
    public string Md { get; set; }

    /// <summary>
    /// Encryption value that has to be sent to the Issuer.
    /// </summary>
    [DataMember(Name = "paRes")]
    public string PaRes { get; set; }

    /// <summary>
    /// Issuer URL.
    /// </summary>
    [DataMember(Name = "issuerUrl")]
    public Uri IssuerUrl { get; set; }

    /// <inheritdoc />
    public override bool ValidateByDefaultValue()
    {
        return base.ValidateByDefaultValue() ||
               CardNumber != null ||
               Md != null ||
               NameOnCard != null ||
               PaRes != null ||
               ThreeDSServerTransID != null ||
               CVV != null ||
               ExpirationDate != null ||
               IssueNumber != null ||
               IssuerUrl != null;
    }
}