using easyJet.Holidays.Api.Domain.Utils;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils
{
    public class LogSanitizerTests
    {
        [Fact]
        public void SanitizeNewLines_NotString_ReturnsInitialObject()
        {
            //Arrange
            var testData = new { TestField = 10 };

            //Act
            var result = LogSanitizer.SanitizeNewLines(testData);

            //Assert
            Assert.NotNull(result);
            Assert.Equivalent(testData, result);
        }

        [Fact]
        public void SanitizeNewLines_String_ReturnsSanitized()
        {
            //Arrange
            var testData = "Test data\n\rnew line";

            //Act
            var result = LogSanitizer.SanitizeNewLines(testData);

            //Assert
            Assert.NotNull(result);
            Assert.Equivalent("Test data__new line", result);
        }
    }
}
