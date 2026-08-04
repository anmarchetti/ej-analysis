namespace easyJet.Holidays.External.EI.Tests;

using Models;
using easyJet.Holidays.Api.Domain.Exceptions.Payment;
using Xunit;

public class ApplePayCardTypeTests
{
    [Theory]
    [InlineData("VISA", "CREDIT", "AV")]
    [InlineData("Visa", "Credit", "AV")]
    [InlineData("ViSa", "CreDit", "AV")]
    [InlineData("VISA", "DEBIT", "AL")]
    [InlineData("MASTERCARD", "CREDIT", "AM")]
    [InlineData("MASTERCARD", "DEBIT", "AD")]
    [InlineData("AMEX", "CREDIT", "AA")]
    [InlineData("AMEX", "DEBIT", "AA")]
    public void GetApplePayCardType_ValidInputs_ReturnsExpectedCode(string network, string type, string expected)
    {
        var result = ApplePayCardType.GetApplePayCardType(network, type);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("DISCOVER", "CREDIT")]
    [InlineData("VISA", "PREPAID")]
    [InlineData("UNKNOWN", "DEBIT")]
    public void GetApplePayCardType_InvalidInputs_ThrowsException(string network, string type)
    {
        Assert.Throws<InvalidPaymentTypeException>(() =>
            ApplePayCardType.GetApplePayCardType(network, type));
    }
}