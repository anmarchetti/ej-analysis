using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.JsonConverters
{
    public class PreserveWhitespaceStringConverterTests
    {
        private readonly PreserveWhitespaceStringConverter _converter = new();

        [Fact]
        public void CanConvert_WhenTypeIsString_ReturnsTrue()
        {
            // Act
            bool result = _converter.CanConvert(typeof(string));

            // Assert
            Assert.True(result);
        }

        [Theory]
        [InlineData(typeof(int))]
        [InlineData(typeof(bool))]
        [InlineData(typeof(object))]
        public void CanConvert_WhenTypeIsNotString_ReturnsFalse(Type type)
        {
            // Act
            bool result = _converter.CanConvert(type);

            // Assert
            Assert.False(result);
        }

        [Theory]
        [InlineData("  Hello  ", "  Hello  ")]
        [InlineData("Hello\t\nWorld", "Hello\t\nWorld")]
        [InlineData("", "")]
        [InlineData(null, null)]
        public void ReadJson_PreservesWhitespace(string input, string expected)
        {
            // Arrange
            using JsonReader jsonReader = CreateJsonReader(input);
            
            // Act
            var result = _converter.ReadJson(jsonReader, typeof(string), null, JsonSerializer.CreateDefault());
            
            // Assert
            Assert.Equal(expected, result);
        }

        [Theory]
        [InlineData("  Hello  ")]
        [InlineData("Hello\t\nWorld")]
        [InlineData("")]
        public void WriteJson_WritesValueCorrectly(string value)
        {
            // Arrange
            using var stringWriter = new StringWriter();
            using var jsonWriter = new JsonTextWriter(stringWriter);
            
            // Act
            _converter.WriteJson(jsonWriter, value, JsonSerializer.CreateDefault());
            
            // Assert
            var result = stringWriter.ToString();
            var expectedJson = JsonConvert.SerializeObject(value);
            Assert.Equal(expectedJson, result);
        }

        [Fact]
        public void WriteJson_WithNullWriter_DoesNotThrowException()
        {
            // Act & Assert
            var exception = Record.Exception(() => _converter.WriteJson(null!, "test", JsonSerializer.CreateDefault()));
            Assert.Null(exception);
        }

        [Fact]
        public void ReadJson_WithNullReader_ReturnsNull()
        {
            // Act
            var result = _converter.ReadJson(null!, typeof(string), null, JsonSerializer.CreateDefault());
            
            // Assert
            Assert.Null(result);
        }

        private static JsonReader CreateJsonReader(string value)
        {
            var json = JsonConvert.SerializeObject(value);
            var stringReader = new StringReader(json);
            var jsonReader = new JsonTextReader(stringReader);
            jsonReader.Read(); // Advance to the first token
            return jsonReader;
        }
    }
}