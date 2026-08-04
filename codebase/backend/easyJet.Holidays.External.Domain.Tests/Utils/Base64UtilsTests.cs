using easyJet.Holidays.External.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Domain.Tests.Utils
{
    public class Base64UtilsTests
    {
        [Theory]
        [InlineData("TestTestTest", "VGVzdFRlc3RUZXN0")]
        [InlineData("211345 Test", "MjExMzQ1IFRlc3Q")]
        [InlineData("", "")]
        [InlineData(null, null)]
        public void Base64Encode_ExpectedBehaviour(string plainText, string base64EncodedData)
        {
            // Act
            var base64Encode = Base64Utils.Base64UrlEncode(plainText);

            // Assert
            base64Encode.Should().BeEquivalentTo(base64EncodedData);
        }

        [Theory]
        [InlineData("MjAyMSBUZXN0", "2021 Test")]
        [InlineData("SGVsbG8gd29ybGQhISE=", "Hello world!!!")]
        [InlineData("eyJtZXNzYWdlVHlwZSI6IkNSZXMiLCJtZXNzYWdlVmVyc2lvbiI6IjIuMS4wIiwidGhyZWVEU1NlcnZlclRyYW5zSUQiOiJlYTQ0MjQ1Ni02NDM5LTQ4MGMtYmVlOS00ZDM4MDk0ZGI0ODQiLCJhY3NUcmFuc0lEIjoiYjdhNTY5M2ItZmZjNy00NjM5LWE3YTktYjA5ZTE3Njc4YzhmIiwiYWNzVWlUeXBlIjoiMDEiLCJjaGFsbGVuZ2VDb21wbGV0aW9uSW5kIjoiWSIsInRyYW5zU3RhdHVzIjoiWSJ9",
            "{\"messageType\":\"CRes\",\"messageVersion\":\"2.1.0\",\"threeDSServerTransID\":\"ea442456-6439-480c-bee9-4d38094db484\",\"acsTransID\":\"b7a5693b-ffc7-4639-a7a9-b09e17678c8f\",\"acsUiType\":\"01\",\"challengeCompletionInd\":\"Y\",\"transStatus\":\"Y\"}")]
        [InlineData("aHR0cHM6Ly9zaXRlY29yZS53ZWItYmx1ZS1wcm9kLWludGVybmFsLmhvbGlkYXlzLmVhc3lqZXQuY29tL3NpdGVjb3JlL3NoZWxsL0FwcGxpY2F0aW9ucy9Db250ZW50JTIwRWRpdG9yLmFzcHg_c2NfYnc9MQ==", "https://sitecore.web-blue-prod-internal.holidays.easyjet.com/sitecore/shell/Applications/Content%20Editor.aspx?sc_bw=1")]
        [InlineData("YW1xcHM6Ly90ZXN0VXNlcjpjRDZGalFlaEBlaS1hbXEyLXNpdDItY29yZS5nd3kudGVzdC5jb206NTY3MQ", "amqps://testUser:cD6FjQeh@ei-amq2-sit2-core.gwy.test.com:5671")]
        [InlineData("", "")]
        [InlineData(null, null)]
        public void Base64Decode_ExpectedBehaviour(string base64EncodedData, string plainText)
        {
            // Act
            var base64Decode = Base64Utils.Base64UrlDecode(base64EncodedData);

            // Assert
            base64Decode.Should().BeEquivalentTo(plainText);
        }
    }
}