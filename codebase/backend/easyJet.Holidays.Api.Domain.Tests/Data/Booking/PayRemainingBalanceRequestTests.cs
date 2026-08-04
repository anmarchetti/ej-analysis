using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Exceptions.Payment;
using Newtonsoft.Json;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests;

public class PayRemainingBalanceRequestTests
{
    [Fact]
    public void PayRemainingBalanceRequestPaymentInfoNull_ShouldDeserializeFromJson()
    {
        // Arrange
        const string json = """
        {
            "paymentInfo": null
        }
        """;

        // Act
        var payRemainingBalanceRequest = JsonConvert.DeserializeObject<PayRemainingBalanceRequest>(json);

        // Assert
        Assert.NotNull(payRemainingBalanceRequest);
        payRemainingBalanceRequest.PaymentInfo.Should().BeNull();
    }
    
    [Fact]
    public void PayRemainingBalanceRequestPaymentInfoEmpty_ShouldDeserializeFromJson()
    {
        // Arrange
        const string json = """
        {
            "paymentInfo": {}
        }
        """;

        // Act
        var payRemainingBalanceRequest = JsonConvert.DeserializeObject<PayRemainingBalanceRequest>(json);

        // Assert
        Assert.NotNull(payRemainingBalanceRequest);
        payRemainingBalanceRequest.PaymentInfo.Should().NotBeNull();
        payRemainingBalanceRequest.PaymentInfo.ValidateByDefaultValue().Should().BeFalse();
    }
    
    [Fact]
    public void PayRemainingBalanceRequestCardPaymentInfo_ShouldDeserializeFromJson()
    {
        // Arrange
        const string json = """
        {
            "paymentInfo": {
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
        }
        """;

        // Act
        var payRemainingBalanceRequest = JsonConvert.DeserializeObject<PayRemainingBalanceRequest>(json);

        // Assert
        Assert.NotNull(payRemainingBalanceRequest);
        payRemainingBalanceRequest.PaymentInfo.Should().NotBeNull();

        var paymentInfo = payRemainingBalanceRequest.PaymentInfo;
        paymentInfo.Should().BeOfType<CardPaymentInfo>();
        payRemainingBalanceRequest.PaymentInfo.ValidateByDefaultValue().Should().BeTrue();
        
        CardPaymentInfo cardPaymentInfo = paymentInfo.AsCardPayment();
        cardPaymentInfo.CardNumber.Should().Be("1234567890123456");
        cardPaymentInfo.NameOnCard.Should().Be("John Doe");
        cardPaymentInfo.ExpirationDate.Should().Be("12/25");
        cardPaymentInfo.CVV.Should().Be("123");
        cardPaymentInfo.CardType.Should().Be(CardType.Visa);
        cardPaymentInfo.IssueNumber.Should().Be("01");
        cardPaymentInfo.Amount.Should().Be(100.50m);
        cardPaymentInfo.CreditAmount.Should().Be(50.25m);
        cardPaymentInfo.Currency.Should().Be("USD");
        cardPaymentInfo.ThreeDSServerTransID.Should().Be("abc123");
        cardPaymentInfo.TransactionReference.Should().Be("txn456");
        cardPaymentInfo.TransStatus.Should().Be("Y");
        cardPaymentInfo.ChallengeComplete.Should().BeTrue();
        cardPaymentInfo.ChallengeError.Should().BeFalse();
        cardPaymentInfo.FingerprintError.Should().BeFalse();
        cardPaymentInfo.FingerprintTimeout.Should().BeFalse();
        cardPaymentInfo.AuthenticationError.Should().BeFalse();
        cardPaymentInfo.Md.Should().Be("encryptedValue");
        cardPaymentInfo.PaRes.Should().Be("responseValue");
        cardPaymentInfo.IssuerUrl.Should().Be("https://issuer.example.com");
    }
    
    [Fact]
    public void PayRemainingBalanceRequestApplePayPaymentInfo_ShouldDeserializeFromJson()
    {
        // Arrange
        const string json = """
        {
            "paymentInfo": {
                "paymentType": "ApplePay",
                "cardType": "Visa",
                "amount": 100.50,
                "creditAmount": 50.25,
                "billingInfo": null,
                "currency": "USD",
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
        }
        """;

        // Act
        var payRemainingBalanceRequest = JsonConvert.DeserializeObject<PayRemainingBalanceRequest>(json);

        // Assert
        Assert.NotNull(payRemainingBalanceRequest);
        payRemainingBalanceRequest.PaymentInfo.Should().NotBeNull();

        var paymentInfo = payRemainingBalanceRequest.PaymentInfo;
        paymentInfo.Should().BeOfType<ApplePayPaymentInfo>();
        payRemainingBalanceRequest.PaymentInfo.ValidateByDefaultValue().Should().BeTrue();
        
        ApplePayPaymentInfo applePayPaymentInfo = (ApplePayPaymentInfo) paymentInfo;
        applePayPaymentInfo.CardType.Should().Be(CardType.Visa);
        applePayPaymentInfo.Amount.Should().Be(100.50m);
        applePayPaymentInfo.CreditAmount.Should().Be(50.25m);
        applePayPaymentInfo.Currency.Should().Be("USD");
        applePayPaymentInfo.Token.PaymentData.Data.Should().Be("data");
        applePayPaymentInfo.Token.PaymentData.Signature.Should().Be("signature");
        applePayPaymentInfo.Token.PaymentData.Version.Should().Be("EC_v1");
        applePayPaymentInfo.Token.PaymentData.Header.PublicKeyHash.Should().Be("publicKeyHash");
        applePayPaymentInfo.Token.PaymentData.Header.EphemeralPublicKey.Should().Be("ephemeralPublicKey");
        applePayPaymentInfo.Token.PaymentData.Header.TransactionId.Should().Be("txnId");
        applePayPaymentInfo.Token.PaymentMethod.DisplayName.Should().Be("MasterCard 0049");
        applePayPaymentInfo.Token.PaymentMethod.Network.Should().Be("MasterCard");
        applePayPaymentInfo.Token.PaymentMethod.Type.Should().Be("credit");
        applePayPaymentInfo.Token.TransactionIdentifier.Should().Be("transactionIdentifier");
    }
    
    [Fact]
    public void PayRemainingBalanceRequestInvalidPaymentInfo_ShouldThrowException()
    {
        // Arrange
        const string json = """
        {
            "paymentInfo": {
                "paymentType": "Invalid",
                "cardType": "Visa",
                "amount": 100.50,
                "creditAmount": 50.25,
                "billingInfo": null,
                "currency": "USD"
            }
        }
        """;

        // Act & Assert
        InvalidPaymentTypeException exception = Assert.Throws<InvalidPaymentTypeException>( () => JsonConvert.DeserializeObject<PayRemainingBalanceRequest>(json));
        
        Assert.Contains("Invalid paymentType 'Invalid'", exception.Message, StringComparison.InvariantCulture);
    }
}