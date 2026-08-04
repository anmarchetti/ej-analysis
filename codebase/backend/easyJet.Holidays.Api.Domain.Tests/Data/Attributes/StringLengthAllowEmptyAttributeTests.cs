using easyJet.Holidays.Api.Domain.Data.Attributes;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests
{
    public class StringLengthAllowEmptyAttributeTests
    {
        private readonly StringLengthAllowEmptyAttribute _sut;

        public StringLengthAllowEmptyAttributeTests()
        {
            _sut = new StringLengthAllowEmptyAttribute(5)
            {
                MinimumLength = 2,
            };
        }

        [Fact]
        public void EmptyString_ValidationSucceeds()
        {
            var result = _sut.IsValid("");

            Assert.True(result);
        }

        [Fact]
        public void TooShortString_ValidationFails()
        {
            var result = _sut.IsValid("a");

            Assert.False(result);
        }

        [Fact]
        public void TooLongString_ValidationFails()
        {
            var result = _sut.IsValid("abcdefg");

            Assert.False(result);
        }

        [Fact]
        public void ProperLengthString_ValidationSucceeds()
        {
            var result = _sut.IsValid("abc");

            Assert.True(result);
        }
    }
}
