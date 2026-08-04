using FluentAssertions;
using Newtonsoft.Json.Linq;
using Xunit;

namespace easyJet.Holidays.External.EI.Tests;

public class MakePaymentRequestPaymentDetailTests
{
    [Theory]
    [MemberData(nameof(MakePaymentRequestPaymentDetailTestData.MapValidRequest), MemberType = typeof(MakePaymentRequestPaymentDetailTestData))]
    public void MakePaymentRequestPaymentDetail_ToString_ShouldReturnExpectedString(EI.Models.MakePaymentRequestPaymentDetail makePaymentRequestPaymentDetail)
    {
        // Arrange

        // Act
        string actualString = makePaymentRequestPaymentDetail.ToString();

        // Assert
        string expectedString =
            "class MakePaymentRequestPaymentDetail {\n" +
            "  Card: \n" +
            "  AuthData: \n" +
            "  CustomerReference: \n" +
            "  PaymentMethod: \n" +
            "  SavePaymentMethod: \n" +
            "  SavedPaymentMethodReference: \n" +
            "  TransactionReference: \n" +
            "  CorporateSecured: \n" +
            "  ApplePay: \n" +
            "}\n";
        actualString.Should().Be(expectedString);
    }

    [Theory]
    [MemberData(nameof(MakePaymentRequestPaymentDetailTestData.MapValidRequest), MemberType = typeof(MakePaymentRequestPaymentDetailTestData))]
    public void MakePaymentRequestPaymentDetail_ToJson_ShouldReturnExpectedJson(EI.Models.MakePaymentRequestPaymentDetail makePaymentRequestPaymentDetail)
    {
        // Arrange

        // Act
        string actualJson = makePaymentRequestPaymentDetail.ToJson();

        // Assert
        string expectedJson =
            """
            {
                "card" : null,
                "authData" : null,
                "customerReference" : null,
                "paymentMethod" : null,
                "savePaymentMethod" : null,
                "savedPaymentMethodReference" : null,
                "transactionReference" : null,
                "corporateSecured" : null,
                "applePay" : null
            }
            """;
        JToken.DeepEquals(JToken.Parse(actualJson), JToken.Parse(expectedJson)).Should().BeTrue();
    }

    static class MakePaymentRequestPaymentDetailTestData
    {
        public static IEnumerable<object[]> MapValidRequest =>
            new List<object[]>
            {
                new object[]
                {
                    new Models.MakePaymentRequestPaymentDetail
                    {
                        
                    }
                }
            };
    }
}