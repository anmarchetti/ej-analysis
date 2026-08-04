using System.Threading;
using easyJet.Foundation.HotelBeds.Security;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Security
{
    public class SignatureHelperTest
    {
        [Fact]
        public void GenerateSignature_ShouldGenerateDifferentStringsSequentially()
        {
            string apiKey = "abc";
            string secret = "def";

            string sig1 = SignatureHelper.GenerateSignature(apiKey, secret);
            Thread.Sleep(1001);
            string sig2 = SignatureHelper.GenerateSignature(apiKey, secret);

            sig2.Should().NotBe(sig1);
        }
    }
}