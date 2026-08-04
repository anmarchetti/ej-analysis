using System.IO;
using System.Text;
using easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.LayoutService.Serialization;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.FieldSerializers
{
    public class RenderingMappingFieldSerializerTests
    {
        private readonly IFieldRenderer fieldRenderer;
        private readonly RenderingMappingFieldSerializer sut;

        public RenderingMappingFieldSerializerTests()
        {
            fieldRenderer = Substitute.For<IFieldRenderer>();
            sut = new RenderingMappingFieldSerializer(fieldRenderer);
        }

        [Fact]
        public void Serialize_ShouldReturnEmptyArray_WhenFieldIsEmpty()
        {
            // Arrange
            var field = CreateMockField(string.Empty, "Mappings");
            var sb = new StringBuilder();

            // Act
            using (var sw = new StringWriter(sb))
            using (var writer = new JsonTextWriter(sw))
            {
                sut.Serialize(field, writer);
            }

            // Assert
            sb.ToString().Should().Be("\"Mappings\":[]");
        }

        [Fact]
        public void Serialize_ShouldWriteSingleMapping_WhenFieldHasSingleMapping()
        {
            // Arrange
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var parameters = "Placeholder=Main";
            var escapedParameters = parameters.Replace("|", "<PIPE>").Replace(":", "<COLON>");
            var value = $"{keyId}:{valueId}:{escapedParameters}";
            var field = CreateMockField(value, "Mappings");
            var sb = new StringBuilder();

            // Act
            using (var sw = new StringWriter(sb))
            using (var writer = new JsonTextWriter(sw))
            {
                sut.Serialize(field, writer);
            }

            // Assert
            var expected = $"\"Mappings\":[{{\"keyId\":\"{keyId.Guid}\",\"valueId\":\"{valueId.Guid}\",\"parameters\":\"{parameters}\"}}]";
            sb.ToString().Should().Be(expected);
        }

        [Fact]
        public void Serialize_ShouldSkipInvalidEntries_AndWriteOnlyValidOnes()
        {
            // Arrange
            var validKey = ID.NewID;
            var validVal1 = ID.NewID;
            var value = $"invalid|{validKey}:{validVal1}:|::|incomplete:data";
            var field = CreateMockField(value, "Mappings");
            var sb = new StringBuilder();

            // Act
            using (var sw = new StringWriter(sb))
            using (var writer = new JsonTextWriter(sw))
            {
                sut.Serialize(field, writer);
            }

            // Assert
            var expected = $"\"Mappings\":[{{\"keyId\":\"{validKey.Guid}\",\"valueId\":\"{validVal1.Guid}\"}}]";
            sb.ToString().Should().Be(expected);
        }

        private static Field CreateMockField(string value, string fieldName = "Mappings")
        {
            var database = Substitute.For<Database>();
            var itemDefinition = new ItemDefinition(ID.NewID, "TestItem", ID.NewID, ID.NewID);
            var itemData = new ItemData(itemDefinition, Language.Parse("en"), Version.Latest, new FieldList());
            var item = Substitute.For<Item>(ID.NewID, itemData, database);
            var field = Substitute.For<Field>(ID.NewID, item);
            field.Name.Returns(fieldName);
            field.Value.Returns(value);
            return field;
        }
    }
}
