using easyJet.Holidays.Api.Domain.Exceptions.Payment;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    /// <summary>
    /// Model representing complete payment info
    /// </summary>
    [Serializable]
    public abstract class PaymentInfo
    {
        /// <summary>
        /// Payment type of the request
        /// </summary>
        [DataMember(Name = "paymentType")]
        public PaymentType PaymentType { get; set; } = PaymentType.CreditDebitCard;
        
        /// <summary>
        /// Card type, e.g. Visa or Mastercard
        /// </summary>
        [DataMember(Name = "cardType")]
        public CardType CardType { get; set; }
        
        /// <summary>
        /// payment amount
        /// </summary>
        [DataMember(Name = "amount")]
        public decimal Amount { get; set; }

        /// <summary>
        /// Credit ammount to process
        /// </summary>
        [DataMember(Name = "creditAmount")]
        public decimal CreditAmount { get; set; }

        /// <summary>
        /// payer billing details
        /// </summary>
        [DataMember(Name = "billingInfo")]
        public BillingInfo BillingInfo { get; set; }

        /// <summary>
        /// payer billing details
        /// </summary>
        [DataMember(Name = "currency")]
        public string Currency { get; set; }

        /// <summary>
        /// Recover PaymentInfo as Card Payment Info
        /// </summary>
        /// <returns></returns>
        /// <exception cref="InvalidPaymentTypeException"></exception>
        public CardPaymentInfo AsCardPayment()
        {
            if (PaymentType != PaymentType.CreditDebitCard)
            {
                throw new InvalidPaymentTypeException("PaymentInfo is not Credit Card");
            }

            return (CardPaymentInfo)this;
        }
        
        /// <summary>
        /// Recover PaymentInfo as ApplePay Payment Info
        /// </summary>
        /// <returns></returns>
        /// <exception cref="InvalidPaymentTypeException"></exception>
        public ApplePayPaymentInfo AsApplePayPayment()
        {
            if (PaymentType != PaymentType.ApplePay)
            {
                throw new InvalidPaymentTypeException("PaymentInfo is not Apple Pay");
            }

            return (ApplePayPaymentInfo)this;
        }

        /// <summary>
        /// Checks if the payment method is <see cref="PaymentType.CreditDebitCard"/>
        /// </summary>
        public bool IsCard()
        {
            return PaymentType == PaymentType.CreditDebitCard;
        }
        
        /// <summary>
        /// Checks if the payment method is <see cref="PaymentType.ApplePay"/>
        /// </summary>
        public bool IsApplePay()
        {
            return PaymentType == PaymentType.ApplePay;
        }
        
        /// <summary>
        /// Validate that object is "empty" (all default values)
        /// </summary>
        /// <returns></returns>
        public virtual bool ValidateByDefaultValue()
        {
            return Amount != 0 ||
                   CreditAmount != 0 ||
                   BillingInfo != null ||
                   Currency != null;
        }
    }
    
    /// <summary>
    /// Credit/debit card's payment system type.
    /// </summary>
    public enum CardType
    {
        /// <summary>
        /// American Express
        /// </summary>
        [EnumMember(Value = "AmericanExpress")]
        AmericanExpress,

        /// <summary>
        /// Mastercard
        /// </summary>
        [EnumMember(Value = "Mastercard")]
        Mastercard,

        /// <summary>
        /// Maestro
        /// </summary>
        [EnumMember(Value = "Maestro")]
        Maestro,

        /// <summary>
        /// Visa
        /// </summary>
        [EnumMember(Value = "Visa")]
        Visa,

        /// <summary>
        /// Invalid payment system type
        /// </summary>
        [EnumMember(Value = "InvalidType")]
        InvalidType
    }
}