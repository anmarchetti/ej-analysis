using FluentAssertions;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Holidays.Api.Domain.CustomJsonConverters.Tests;

public class SiteCoreNameValueListConverterTests
{
    [Fact]
    public void ReadJson_ShouldHandleEmptyString()
    {
        // Arrange
        var converter = new SiteCoreNameValueListConverter<int>();
        string jsonInput = "";

        // Act
        using var jsonReader = new JsonTextReader(new StringReader(JsonConvert.ToString(jsonInput)));
        jsonReader.Read();
        var result = converter.ReadJson(jsonReader, null, null, null);

        // Assert
        result.Should().BeEquivalentTo(new Dictionary<string, int>());
    }

    [Fact]
    public void ReadJson_ShouldDeserializeStringToIntDictionary()
    {
        // Arrange
        var converter = new SiteCoreNameValueListConverter<int>();
        string jsonInput = "Key1=1&Key2=2";
        var expectedDictionary = new Dictionary<string, int>
        {
            { "Key1", 1 },
            { "Key2", 2 }
        };

        // Act
        using var jsonReader = new JsonTextReader(new StringReader(JsonConvert.ToString(jsonInput)));
        jsonReader.Read();
        var result = converter.ReadJson(jsonReader, null, null, null);

        // Assert
        result.Should().BeEquivalentTo(expectedDictionary);
    }

    [Fact]
    public void ReadJson_ShouldDeserializeStringToStringDictionary()
    {
        // Arrange
        var converter = new SiteCoreNameValueListConverter<string>();
        string jsonInput = "Key1=val1&Key2=val2";
        var expectedDictionary = new Dictionary<string, string>
        {
            { "Key1", "val1" },
            { "Key2", "val2" }
        };

        // Act
        using var jsonReader = new JsonTextReader(new StringReader(JsonConvert.ToString(jsonInput)));
        jsonReader.Read();
        var result = converter.ReadJson(jsonReader, null, null, null);

        // Assert
        result.Should().BeEquivalentTo(expectedDictionary);
    }

    [Fact]
    public void ReadJson_ThrowsExceptionForGenericTypeWithoutParseMethod()
    {
        // Arrange
        var converter = new SiteCoreNameValueListConverter<object>();

        // Act
        using var jsonReader = new JsonTextReader(new StringReader(JsonConvert.ToString("123")));
        jsonReader.Read();
        var act = () => converter.ReadJson(jsonReader, null, null, null);

        // Assert
        act.Should().Throw<Exception>().WithMessage("*doesn't have a Parse method which takes a string");
    }

    [Fact]
    public void CanConvert_ShouldReturnTrueForDictionaryType()
    {
        // Arrange
        var converter = new SiteCoreNameValueListConverter<int>();

        // Act
        bool result = converter.CanConvert(typeof(IDictionary<string, int>));

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void CanConvert_ShouldReturnFalseForNonDictionaryType()
    {
        // Arrange
        var converter = new SiteCoreNameValueListConverter<int>();

        // Act
        bool result = converter.CanConvert(typeof(List<int>));

        // Assert
        result.Should().BeFalse();
    }
}