using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Exceptions.Payment;
using FluentAssertions;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests;

public class PaymentInfoTests
{
    [Fact]
    public void CardPaymentInfo_ShouldDeserializeFromJson()
    {
        // Arrange
        const string json = """
        {
            "cardNumber": "1234567890123456",
            "nameOnCard": "John Doe",
            "expirationDate": "12/25",
            "cvv": "123",
            "cardType": "Visa",
            "issueNumber": "01",
            "amount": 100.50,
            "creditAmount": 50.25,
            "billingInfo": null,
            "currency": "USD",
            "threeDSServerTransID": "abc123",
            "transactionReference": "txn456",
            "transStatus": "Y",
            "challengeComplete": true,
            "challengeError": false,
            "fingerprintError": false,
            "fingerprintTimeout": false,
            "authenticationError": false,
            "md": "encryptedValue",
            "paRes": "responseValue",
            "issuerUrl": "https://issuer.example.com"
        }
        """;

        // Act
        CardPaymentInfo paymentInfo = JsonConvert.DeserializeObject<CardPaymentInfo>(json);

        // Assert
        Assert.NotNull(paymentInfo);
        paymentInfo.CardNumber.Should().Be("1234567890123456");
        paymentInfo.NameOnCard.Should().Be("John Doe");
        paymentInfo.ExpirationDate.Should().Be("12/25");
        paymentInfo.CVV.Should().Be("123");
        paymentInfo.CardType.Should().Be(CardType.Visa);
        paymentInfo.IssueNumber.Should().Be("01");
        paymentInfo.Amount.Should().Be(100.50m);
        paymentInfo.CreditAmount.Should().Be(50.25m);
        paymentInfo.Currency.Should().Be("USD");
        paymentInfo.ThreeDSServerTransID.Should().Be("abc123");
        paymentInfo.TransactionReference.Should().Be("txn456");
        paymentInfo.TransStatus.Should().Be("Y");
        paymentInfo.ChallengeComplete.Should().BeTrue();
        paymentInfo.ChallengeError.Should().BeFalse();
        paymentInfo.FingerprintError.Should().BeFalse();
        paymentInfo.FingerprintTimeout.Should().BeFalse();
        paymentInfo.AuthenticationError.Should().BeFalse();
        paymentInfo.Md.Should().Be("encryptedValue");
        paymentInfo.PaRes.Should().Be("responseValue");
        paymentInfo.IssuerUrl.Should().Be("https://issuer.example.com");
        paymentInfo.IsCard().Should().BeTrue();
        paymentInfo.IsApplePay().Should().BeFalse();
    }
    
    [Fact]
    public void CardPaymentInfo_ShouldBeParsedToCardPaymentInfo()
    {
        // Arrange
        PaymentInfo paymentInfo = new CardPaymentInfo();

        // Act
        CardPaymentInfo cardPaymentInfo = paymentInfo.AsCardPayment();
        
        // Assert
        Assert.NotNull(cardPaymentInfo);
        cardPaymentInfo.PaymentType.Should().Be(PaymentType.CreditDebitCard);
        cardPaymentInfo.IsCard().Should().BeTrue();
    }
    
    [Fact]
    public void CardPaymentInfo_ShouldNotBeConvertedToOtherCardType()
    {
        // Arrange
        PaymentInfo paymentInfo = new CardPaymentInfo();

        // Act & Assert
        InvalidPaymentTypeException exception = Assert.Throws<InvalidPaymentTypeException>(()=> paymentInfo.AsApplePayPayment());
        exception.Message.Should().Be("PaymentInfo is not Apple Pay");
    }
    
    [Fact]
    public void ApplePayPaymentInfo_ShouldDeserializeFromJson()
    {
        // Arrange
        const string json = """
      {
        "token": {
          "paymentData": {
            "data": "data",
            "signature": "signature",
            "version": "EC_v1",
            "header": {
              "publicKeyHash": "publicKeyHash",
              "ephemeralPublicKey": "ephemeralPublicKey",
              "transactionId": "txnId"
            }
          },
          "paymentMethod": {
            "displayName": "MasterCard 0049",
            "network": "MasterCard",
            "type": "credit"
          },
          "transactionIdentifier": "transactionIdentifier"
        }
      }
      """;

        // Act
        ApplePayPaymentInfo paymentInfo = JsonConvert.DeserializeObject<ApplePayPaymentInfo>(json);

        // Assert
        Assert.NotNull(paymentInfo);
        paymentInfo.Token.PaymentData.Data.Should().Be("data");
        paymentInfo.Token.PaymentData.Signature.Should().Be("signature");
        paymentInfo.Token.PaymentData.Version.Should().Be("EC_v1");
        paymentInfo.Token.PaymentData.Header.PublicKeyHash.Should().Be("publicKeyHash");
        paymentInfo.Token.PaymentData.Header.EphemeralPublicKey.Should().Be("ephemeralPublicKey");
        paymentInfo.Token.PaymentData.Header.TransactionId.Should().Be("txnId");
        paymentInfo.Token.PaymentMethod.DisplayName.Should().Be("MasterCard 0049");
        paymentInfo.Token.PaymentMethod.Network.Should().Be("MasterCard");
        paymentInfo.Token.PaymentMethod.Type.Should().Be("credit");
        paymentInfo.Token.TransactionIdentifier.Should().Be("transactionIdentifier");
        paymentInfo.IsCard().Should().BeFalse();
        paymentInfo.IsApplePay().Should().BeTrue();
    }
    
    [Fact]
    public void ApplePayPaymentInfo_ShouldBeParsedToCardPaymentInfo()
    {
        // Arrange
        PaymentInfo paymentInfo = new ApplePayPaymentInfo();

        // Act
        ApplePayPaymentInfo applePayPaymentInfo = paymentInfo.AsApplePayPayment();
        
        // Assert
        Assert.NotNull(applePayPaymentInfo);
        applePayPaymentInfo.PaymentType.Should().Be(PaymentType.ApplePay);
        applePayPaymentInfo.IsApplePay().Should().BeTrue();
    }
    
    [Fact]
    public void ApplePayPaymentInfo_ShouldNotBeConvertedToOtherPaymentType()
    {
        // Arrange
        PaymentInfo paymentInfo = new ApplePayPaymentInfo();

        // Act & Assert
        InvalidPaymentTypeException exception = Assert.Throws<InvalidPaymentTypeException>(()=> paymentInfo.AsCardPayment());
        exception.Message.Should().Be("PaymentInfo is not Credit Card");
    }
}