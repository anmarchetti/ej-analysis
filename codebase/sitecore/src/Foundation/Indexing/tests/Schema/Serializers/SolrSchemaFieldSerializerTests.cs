using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Indexing.Schema.Fields;
using easyJet.Foundation.Indexing.Schema.Serializers;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Indexing.Tests.Schema.Serializers
{
    public class SolrSchemaFieldSerializerTests
    {
        private readonly SolrSchemaFieldSerializer serializer;

        public SolrSchemaFieldSerializerTests()
        {
            serializer = new SolrSchemaFieldSerializer();
        }

        [Fact]
        public void Serialize_ShouldReturnXElement_WithFieldAttributes()
        {
            // Arrange
            var field = new SolrSchemaField("testField");

            field.Properties.Add("type", "string");
            field.Properties.Add("indexed", "true");
            field.Properties.Add("stored", "true");

            // Act
            var result = serializer.Serialize(field);

            // Assert
            result.Should().NotBeNull();
            result.Name.LocalName.Should().Be("add-field");
            result.Element("name").Value.Should().Be("testField");
            result.Element("type").Value.Should().Be("string");
            result.Element("indexed").Value.Should().Be("true");
            result.Element("stored").Value.Should().Be("true");
        }

        [Fact]
        public void Serialize_ShouldReturnXElement_WithOnlyNameAttribute_WhenNoProperties()
        {
            // Arrange
            var field = new SolrSchemaField
            {
                Name = "testField"
            };

            // Act
            var result = serializer.Serialize(field);

            // Assert
            result.Should().NotBeNull();
            result.Name.LocalName.Should().Be("add-field");
            result.Element("name").Value.Should().Be("testField");
            result.Elements().Count().Should().Be(1);
        }
    }
}