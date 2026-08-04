using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment.Fields;
using easyJet.Foundation.Presentation.Models;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Fields
{
    public class RenderingMappingFieldTests
    {
        [Fact]
        public void Constructor_WithValidField_InitializesCorrectly()
        {
            // Arrange
            var field = Substitute.For<Field>(ID.NewID, Substitute.For<Item>(ID.NewID, ItemData.Empty, Substitute.For<Database>()));

            // Act
            var sut = new RenderingMappingField(field);

            // Assert
            sut.Should().NotBeNull();
            sut.InnerField.Should().Be(field);
        }

        [Fact]
        public void GetMappings_WhenFieldIsEmpty_ReturnsEmptyList()
        {
            // Arrange
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetMappings_WhenFieldHasSingleMappingWithParameters_ReturnsSingleMapping()
        {
            // Arrange
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var parameters = "Placeholder=Main&Data Source=/sitecore/content";
            var value = $"{keyId}:{valueId}:{parameters}";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].KeyId.Should().Be(keyId);
            result[0].ValueId.Should().Be(valueId);
            result[0].Parameters.Should().Be(parameters);
            result[0].IsValid.Should().BeTrue();
        }

        [Fact]
        public void GetMappings_WhenFieldHasSingleMappingWithEscapedParameters_ReturnsUnescapedParameters()
        {
            // Arrange
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var parameters = "Placeholder=Main|Fallback&Data Source=/sitecore:content";
            var escapedParameters = parameters.Replace("|", "<PIPE>").Replace(":", "<COLON>");
            var value = $"{keyId}:{valueId}:{escapedParameters}";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].Parameters.Should().Be(parameters);
        }

        [Fact]
        public void GetMappings_WhenFieldHasMappingWithoutParameters_ReturnsEmptyParameters()
        {
            // Arrange
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var value = $"{keyId}:{valueId}:";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].Parameters.Should().BeEmpty();
        }

        [Fact]
        public void GetMappings_WhenFieldHasMappingWithoutParametersPart_ReturnsEmptyParameters()
        {
            // Arrange
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var value = $"{keyId}:{valueId}";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().HaveCount(1);
            result[0].KeyId.Should().Be(keyId);
            result[0].ValueId.Should().Be(valueId);
            result[0].Parameters.Should().BeEmpty();
        }

        [Fact]
        public void GetMappings_WhenFieldHasMultipleMappings_ReturnsAllMappings()
        {
            // Arrange
            var key1 = ID.NewID;
            var val1 = ID.NewID;
            var params1 = "Placeholder=Main";
            var key2 = ID.NewID;
            var val2 = ID.NewID;
            var params2 = "Data Source=/sitecore/content";
            var value = $"{key1}:{val1}:{params1}|{key2}:{val2}:{params2}";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result[0].KeyId.Should().Be(key1);
            result[0].ValueId.Should().Be(val1);
            result[0].Parameters.Should().Be(params1);
            result[1].KeyId.Should().Be(key2);
            result[1].ValueId.Should().Be(val2);
            result[1].Parameters.Should().Be(params2);
        }

        [Fact]
        public void GetMappings_WhenFieldHasInvalidEntries_SkipsInvalidEntries()
        {
            // Arrange
            var validKey = ID.NewID;
            var validVal1 = ID.NewID;
            var validParams = "Placeholder=Main";
            var value = $"invalid|{validKey}:{validVal1}:{validParams}|::|incomplete:data";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].KeyId.Should().Be(validKey);
            result[0].ValueId.Should().Be(validVal1);
            result[0].Parameters.Should().Be(validParams);
        }

        [Fact]
        public void GetMappings_WhenEntryHasOnlyOnePartNoColon_SkipsEntry()
        {
            // ARRANGE
            var validKey = ID.NewID;
            var validVal = ID.NewID;
            var value = $"singlepartnocolon|{validKey}:{validVal}:params";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // ACT
            var result = sut.GetMappings();

            // ASSERT
            result.Should().HaveCount(1);
            result[0].KeyId.Should().Be(validKey);
        }

        [Fact]
        public void GetMappings_WhenFieldValueIsNull_ReturnsEmptyList()
        {
            // Arrange
            var field = CreateMockField(null);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void SetMappings_WhenMappingsListIsEmpty_SetsEmptyValue()
        {
            // Arrange
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);
            var mappings = new List<RenderingMapping>();

            // Act
            sut.SetMappings(mappings);

            // Assert
            sut.Value.Should().BeEmpty();
        }

        [Fact]
        public void SetMappings_WhenMappingsListIsNull_SetsEmptyValue()
        {
            // Arrange
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);

            // Act
            sut.SetMappings(null);

            // Assert
            sut.Value.Should().BeEmpty();
        }

        [Fact]
        public void SetMappings_WhenMappingsListHasValidEntries_SetsCorrectValue()
        {
            // Arrange
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var parameters = "Placeholder=Main";
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);
            var mappings = new List<RenderingMapping> { new RenderingMapping(keyId, valueId, parameters) };

            // Act
            sut.SetMappings(mappings);

            // Assert
            var expected = $"{keyId}:{valueId}:{parameters}";
            sut.Value.Should().Be(expected);
        }

        [Fact]
        public void SetMappings_WhenParametersAreNull_WritesTrailingColon()
        {
            // Arrange
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);
            var mappings = new List<RenderingMapping> { new RenderingMapping(keyId, valueId, null) };

            // Act
            sut.SetMappings(mappings);

            // Assert
            var expected = $"{keyId}:{valueId}:";
            sut.Value.Should().Be(expected);
        }

        [Fact]
        public void SetMappings_WhenParametersContainSpecialCharacters_EscapesCorrectly()
        {
            // Arrange
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var parameters = "Placeholder=Main|Fallback&Data Source=/sitecore:content";
            var expectedEscaped = parameters.Replace("|", "<PIPE>").Replace(":", "<COLON>");
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);
            var mappings = new List<RenderingMapping> { new RenderingMapping(keyId, valueId, parameters) };

            // Act
            sut.SetMappings(mappings);

            // Assert
            var expected = $"{keyId}:{valueId}:{expectedEscaped}";
            sut.Value.Should().Be(expected);
        }

        [Fact]
        public void SetMappings_WhenMappingsListHasMultipleEntries_SetsCorrectValue()
        {
            // Arrange
            var key1 = ID.NewID;
            var val1 = ID.NewID;
            var params1 = "Placeholder=Main";
            var key2 = ID.NewID;
            var val2 = ID.NewID;
            var params2 = "Data Source=/sitecore/content";
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);
            var mappings = new List<RenderingMapping>
            {
                new RenderingMapping(key1, val1, params1),
                new RenderingMapping(key2, val2, params2)
            };

            // Act
            sut.SetMappings(mappings);

            // Assert
            var expected = $"{key1}:{val1}:{params1}|{key2}:{val2}:{params2}";
            sut.Value.Should().Be(expected);
        }

        [Fact]
        public void SetMappings_WhenMappingsListHasInvalidEntries_SkipsInvalidEntries()
        {
            // Arrange
            var validKey = ID.NewID;
            var validVal1 = ID.NewID;
            var validParams = "Placeholder=Main";
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);
            var mappings = new List<RenderingMapping>
            {
                new RenderingMapping(ID.Null, ID.NewID, "Invalid"),
                new RenderingMapping(validKey, validVal1, validParams),
                null
            };

            // Act
            sut.SetMappings(mappings);

            // Assert
            var expected = $"{validKey}:{validVal1}:{validParams}";
            sut.Value.Should().Be(expected);
        }

        [Fact]
        public void ImplicitConversion_WhenFieldIsNull_ReturnsNull()
        {
            // Arrange
            Field field = null;

            // Act
            RenderingMappingField result = field;

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void ImplicitConversion_WhenFieldIsNotNull_ReturnsRenderingMappingField()
        {
            // Arrange
            var field = CreateMockField("test");

            // Act
            RenderingMappingField result = field;

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<RenderingMappingField>();
        }

        [Fact]
        public void RoundTrip_SetAndGetMappings_PreservesData()
        {
            // Arrange
            var key1 = ID.NewID;
            var val1 = ID.NewID;
            var params1 = "Placeholder=Main&Cacheable=1";
            var key2 = ID.NewID;
            var val2 = ID.NewID;
            var params2 = "Data Source=/sitecore/content&VaryByData=1";
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);
            var originalMappings = new List<RenderingMapping>
            {
                new RenderingMapping(key1, val1, params1),
                new RenderingMapping(key2, val2, params2)
            };

            // Act
            sut.SetMappings(originalMappings);
            var retrievedMappings = sut.GetMappings();

            // Assert
            retrievedMappings.Should().HaveCount(2);
            retrievedMappings[0].KeyId.Should().Be(key1);
            retrievedMappings[0].ValueId.Should().Be(val1);
            retrievedMappings[0].Parameters.Should().Be(params1);
            retrievedMappings[1].KeyId.Should().Be(key2);
            retrievedMappings[1].ValueId.Should().Be(val2);
            retrievedMappings[1].Parameters.Should().Be(params2);
        }

        [Fact]
        public void RoundTrip_WithSpecialCharactersInParameters_PreservesData()
        {
            // Arrange
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var parameters = "Placeholder=Main|Fallback&Data Source=/sitecore:content/home";
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);
            var originalMappings = new List<RenderingMapping>
            {
                new RenderingMapping(keyId, valueId, parameters)
            };

            // Act
            sut.SetMappings(originalMappings);
            var retrievedMappings = sut.GetMappings();

            // Assert
            retrievedMappings.Should().HaveCount(1);
            retrievedMappings[0].Parameters.Should().Be(parameters);
        }

        [Fact]
        public void GetMappings_WhenValueIdIsInvalid_ShouldParseWithNullValueId()
        {
            // Arrange - valid keyId, invalid valueId
            var keyId = ID.NewID;
            var value = $"{keyId}:invalid-guid:Placeholder=Main";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().HaveCount(1);
            result[0].KeyId.Should().Be(keyId);
            result[0].ValueId.Should().Be(ID.Null);
            result[0].Parameters.Should().Be("Placeholder=Main");
        }

        [Fact]
        public void GetMappings_WhenOnlyKeyIdProvided_ShouldSkipInvalidEntry()
        {
            // Arrange
            var value = ID.NewID.ToString();
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert - should skip because less than 2 parts
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetMappings_WhenFieldValueIsWhitespace_ReturnsEmptyList()
        {
            // Arrange
            var field = CreateMockField("   ");
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetMappings_WhenEntryIsWhitespaceOnly_SkipsEntry()
        {
            // Arrange
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var value = $"   |{keyId}:{valueId}:params|  ";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().HaveCount(1);
            result[0].KeyId.Should().Be(keyId);
        }

        [Fact]
        public void GetMappings_WhenFieldHasJustRemoveValue_ReturnsIsJustRemoveTrue()
        {
            // Arrange
            var keyId = ID.NewID;
            var value = $"{keyId}:JUST_REMOVE:";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().HaveCount(1);
            result[0].IsJustRemove.Should().BeTrue();
        }

        [Fact]
        public void GetMappings_WhenFieldHasJustRemoveValue_KeyIdIsValidAndValueIdIsNull()
        {
            // Arrange
            var keyId = ID.NewID;
            var value = $"{keyId}:JUST_REMOVE:";
            var field = CreateMockField(value);
            var sut = new RenderingMappingField(field);

            // Act
            var result = sut.GetMappings();

            // Assert
            result.Should().HaveCount(1);
            result[0].KeyId.Should().Be(keyId);
            result[0].ValueId.Should().Be(ID.Null);
        }

        [Fact]
        public void SetMappings_WhenMappingIsJustRemove_SerializesAsSentinel()
        {
            // Arrange
            var keyId = ID.NewID;
            var mapping = new RenderingMapping(keyId, ID.Null, string.Empty, default, isJustRemove: true);
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);

            // Act
            sut.SetMappings(new List<RenderingMapping> { mapping });

            // Assert
            sut.Value.Should().StartWith($"{keyId}:JUST_REMOVE:");
        }

        [Fact]
        public void GetMappings_JustRemoveRoundTrip_PreservesIsJustRemove()
        {
            // Arrange
            var keyId = ID.NewID;
            var original = new RenderingMapping(keyId, ID.Null, string.Empty, default, isJustRemove: true);
            var field = CreateMockField(string.Empty);
            var sut = new RenderingMappingField(field);

            // Act
            sut.SetMappings(new List<RenderingMapping> { original });
            var result = sut.GetMappings();

            // Assert
            result.Should().HaveCount(1);
            result[0].IsJustRemove.Should().BeTrue();
            result[0].KeyId.Should().Be(keyId);
        }

        private Field CreateMockField(string value)
        {
            var database = Substitute.For<Database>();
            var itemData = new ItemData(new ItemDefinition(ID.NewID, "TestItem", ID.NewID, ID.NewID), Language.Parse("en"), Version.Latest, new FieldList());
            var item = Substitute.For<Item>(ID.NewID, itemData, database);

            var field = Substitute.For<Field>(ID.NewID, item);
            field.Value.Returns(value);

            field.When(f => f.SetValue(Arg.Any<string>(), true))
                .Do(callInfo => field.Value.Returns(callInfo.ArgAt<string>(0)));

            return field;
        }
    }
}
