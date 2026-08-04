using FluentAssertions;
using Newtonsoft.Json.Linq;
using Xunit;

namespace easyJet.Holidays.External.EI.Tests;

public class ApplePayTests
{
    [Theory]
    [MemberData(nameof(ApplePayTestData.MapValidRequest), MemberType = typeof(ApplePayTestData))]
    public void ApplePay_ToString_ShouldReturnExpectedString(EI.Models.ApplePay applePay)
    {
        // Arrange

        // Act
        string actualString = applePay.ToString();

        // Assert
        string expectedString =
            "class ApplePay {\n" +
            "  CardType: card-type\n" +
            "  Base64Token: base64-token\n" +
            "}\n";
        actualString.Should().Be(expectedString);
    }

    [Theory]
    [MemberData(nameof(ApplePayTestData.MapValidRequest), MemberType = typeof(ApplePayTestData))]
    public void ApplePay_ToJson_ShouldReturnExpectedJson(EI.Models.ApplePay applePay)
    {
        // Arrange

        // Act
        string actualJson = applePay.ToJson();

        // Assert
        string expectedJson =
            """
            {
                "cardType": "card-type",
                "token": "base64-token"
            }
            """;
        JToken.DeepEquals(JToken.Parse(actualJson), JToken.Parse(expectedJson)).Should().BeTrue();
    }

    static class ApplePayTestData
    {
        public static IEnumerable<object[]> MapValidRequest =>
            new List<object[]>
            {
                new object[]
                {
                    new EI.Models.ApplePay
                    {
                        CardType = "card-type",
                        Base64Token = "base64-token"
                    }
                }
            };
    }
}