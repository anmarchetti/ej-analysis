using System.Xml;
using easyJet.Foundation.Indexing.Schema.Configurations;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Indexing.Tests.Schema.Configurations
{
    public class SolrSchemaConfigurationTests
    {
        private readonly SolrSchemaConfiguration configuration;

        public SolrSchemaConfigurationTests()
        {
            configuration = new SolrSchemaConfiguration("index_name");
        }

        [Fact]
        public void AddField_ShouldAddFieldToConfiguration_WhenNodeIsValid()
        {
            // Arrange
            var xmlDoc = new XmlDocument();
            var node = xmlDoc.CreateElement("field");
            node.SetAttribute("name", "testField");
            node.SetAttribute("type", "string");

            // Act
            configuration.AddField(node);

            // Assert
            configuration.Fields.Should().ContainSingle();
            configuration.Fields[0].Name.Should().Be("testField");
            configuration.Fields[0].Properties["type"].Should().Be("string");
        }

        [Fact]
        public void AddField_ShouldNotAddFieldToConfiguration_WhenNodeIsInvalid()
        {
            // Arrange
            var xmlDoc = new XmlDocument();
            var node = xmlDoc.CreateElement("field");

            // Act
            configuration.AddField(node);

            // Assert
            configuration.Fields.Should().BeEmpty();
        }

        [Fact]
        public void AddCopyField_ShouldAddCopyFieldToConfiguration_WhenNodeIsValid()
        {
            // Arrange
            var xmlDoc = new XmlDocument();
            var node = xmlDoc.CreateElement("copyField");
            node.SetAttribute("source", "sourceField");
            node.SetAttribute("dest", "destField");

            // Act
            configuration.AddCopyField(node);

            // Assert
            configuration.CopyFields.Should().ContainSingle();
            configuration.CopyFields[0].Source.Should().Be("sourceField");
            configuration.CopyFields[0].Destination.Should().Be("destField");
        }

        [Fact]
        public void AddCopyField_ShouldNotAddCopyFieldToConfiguration_WhenNodeIsInvalid()
        {
            // Arrange
            var xmlDoc = new XmlDocument();
            var node = xmlDoc.CreateElement("copyField");

            // Act
            configuration.AddCopyField(node);

            // Assert
            configuration.CopyFields.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_ShouldAddIndexNames()
        {
            // Act
            var actual = new SolrSchemaConfiguration("index_name|index_name_2");

            // Assert
            actual.IndexNames.Should().HaveCount(2);
            actual.IndexNames.Should().Contain("index_name");
            actual.IndexNames.Should().Contain("index_name_2");
        }
    }
}