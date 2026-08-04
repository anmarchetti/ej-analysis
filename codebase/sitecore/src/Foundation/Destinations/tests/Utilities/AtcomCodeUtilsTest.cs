using easyJet.Foundation.Destinations.Utilities;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Utilities
{
    public class AtcomCodeUtilsTest
    {
        [Fact]
        public void GetAtcom_From_EmptyStringCode()
        {
            var hbgCode = string.Empty;
            var expected = string.Empty;

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_NullStringCode()
        {
            string hbgCode = null;
            string expected = null;

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_4dHbgStringCode()
        {
            var hbgCode = "1234";
            var expected = "X9001234";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_4dHbgStringCode2()
        {
            var hbgCode = "X9001234";
            var expected = "X9001234";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_4dHbgStringCodeWithWhitespace()
        {
            var hbgCode = " 1234  ";
            var expected = "X9001234";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_5dHbgStringCode()
        {
            var hbgCode = "12345";
            var expected = "X9012345";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_5dHbgStringCode2()
        {
            var hbgCode = "X9012345";
            var expected = "X9012345";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_5dHbgStringCodeWithWhitespace()
        {
            var hbgCode = "  12345";
            var expected = "X9012345";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_6dHbgStringCode()
        {
            var hbgCode = "123456";
            var expected = "X9123456";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_6dHbgStringCode2()
        {
            var hbgCode = "X9123456";
            var expected = "X9123456";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_6dHbgStringCodeWithWhitespace()
        {
            var hbgCode = "123456   ";
            var expected = "X9123456";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_7dHbgStringCode()
        {
            var hbgCode = "1234569";
            var expected = "X1234569";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_7dHbgStringCode2()
        {
            var hbgCode = "X1234569";
            var expected = "X1234569";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void GetAtcom_From_7dHbgStringCodeWithWhitespace()
        {
            var hbgCode = "1234560 ";
            var expected = "X1234560";

            var result = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hbgCode);
            Assert.Equal(expected, result);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("  ")]
        public void IsExpediaRoomFolderCode_ReturnsFalse_ForNullOrWhitespace(string code)
        {
            Assert.False(AtcomCodeUtils.IsExpediaRoomFolderCode(code));
        }

        [Theory]
        [InlineData("W123")]
        [InlineData("W12")]
        public void IsExpediaRoomFolderCode_ReturnsFalse_ForShortCodes(string code)
        {
            Assert.False(AtcomCodeUtils.IsExpediaRoomFolderCode(code));
        }

        [Fact]
        public void IsExpediaRoomFolderCode_ReturnsTrue_ForValidCodes_AndIsCaseInsensitive_AndTrimmed()
        {
            Assert.True(AtcomCodeUtils.IsExpediaRoomFolderCode("W123456"));
            Assert.True(AtcomCodeUtils.IsExpediaRoomFolderCode(" w123456 "));
            Assert.True(AtcomCodeUtils.IsExpediaRoomFolderCode("w123456"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("  ")]
        public void IsHotelBedsRoomFolderCode_ReturnsFalse_ForNullOrWhitespace(string code)
        {
            Assert.False(AtcomCodeUtils.IsHotelBedsRoomFolderCode(code));
        }

        [Theory]
        [InlineData("X123")]
        [InlineData("X12")]
        public void IsHotelBedsRoomFolderCode_ReturnsFalse_ForShortCodes(string code)
        {
            Assert.False(AtcomCodeUtils.IsHotelBedsRoomFolderCode(code));
        }

        [Fact]
        public void IsHotelBedsRoomFolderCode_ReturnsTrue_ForValidCodes_AndIsCaseInsensitive_AndTrimmed()
        {
            Assert.True(AtcomCodeUtils.IsHotelBedsRoomFolderCode("X123456"));
            Assert.True(AtcomCodeUtils.IsHotelBedsRoomFolderCode(" x123456 "));
            Assert.True(AtcomCodeUtils.IsHotelBedsRoomFolderCode("x123456"));
        }

        [Theory]
        [InlineData("WCTRDK")]
        [InlineData("W123A56")]
        [InlineData("W12 456")]
        [InlineData("W-12345")]
        public void IsExpediaRoomFolderCode_ReturnsFalse_WhenSuffixContainsNonDigits(string code)
        {
            Assert.False(AtcomCodeUtils.IsExpediaRoomFolderCode(code));
        }

        [Theory]
        [InlineData("XCTRDK")]
        [InlineData("X123A56")]
        [InlineData("X12 456")]
        [InlineData("X-12345")]
        public void IsHotelBedsRoomFolderCode_ReturnsFalse_WhenSuffixContainsNonDigits(string code)
        {
            Assert.False(AtcomCodeUtils.IsHotelBedsRoomFolderCode(code));
        }
    }
}