using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Settings;

namespace easyJet.Holiday.IntegrationTests.Shared.Constants;

public class PaymentInfoConstants
{
    public static CardPaymentInfo CreatePaymentInfo(decimal amount, decimal creditAmount = 0, string? currency = null)
    {
        return new CardPaymentInfo
        {
            Amount = amount - creditAmount,
            CreditAmount = creditAmount,
            Currency = currency ?? Currency.GBP.Code,
            CardNumber = "4111111111111111",
            CardType = CardType.Visa,
            CVV = "737",
            ExpirationDate = "03/30",
            IssueNumber = "",
            NameOnCard = "Card",
            BillingInfo = new BillingInfo
            {
                Address = "Addres",
                City = "Town",
                FullName = "Test User",
                PostCode = "505"
            }
        };
    }

    public static PaymentInfo AmountOnlyPaymentInfo(decimal amount)
    {
        //No card info - used in booking amendments as refund amount
        return new CardPaymentInfo
        {
            Amount = amount
        };
    }

    public static PaymentInfo CreditOnlyPaymentInfo(decimal amount, string? currency = null)
    {
        return new CardPaymentInfo
        {
            CreditAmount = amount,
            Currency = currency ?? Currency.GBP.Code
        };
    }
}