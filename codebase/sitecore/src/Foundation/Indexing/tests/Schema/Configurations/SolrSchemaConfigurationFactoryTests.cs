using System;
using System.Xml;
using AutoFixture.Xunit2;
using easyJet.Foundation.Indexing.Schema.Configurations;
using easyJet.Foundation.Indexing.Schema.Fields;
using easyJet.Foundation.Indexing.Schema.Serializers;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Xunit;

namespace easyJet.Foundation.Indexing.Tests.Schema.Configurations
{
    public class SolrSchemaConfigurationFactoryTests
    {
        private readonly BaseFactory baseFactory;
        private readonly SolrSchemaConfigurationFactory configFactory;

        public SolrSchemaConfigurationFactoryTests()
        {
            baseFactory = Substitute.For<BaseFactory>();
            configFactory = new SolrSchemaConfigurationFactory(baseFactory);
        }

        [Theory]
        [AutoData]
        public void Create_ShouldReturnSolrSchemaConfiguration(string indexName)
        {
            // Arrange
            baseFactory.CreateObject<ISolrSchemaConfiguration>(Arg.Any<XmlNode>()).Returns(new SolrSchemaConfiguration(indexName));

            // Act
            var result = configFactory.Create();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<SolrSchemaConfiguration>();
            result.IndexNames.Should().Contain(indexName);
        }

        [Fact]
        public void CreateSerializer_ShouldReturnFieldSerializer_WhenFieldTypeIsSolrSchemaField()
        {
            // Arrange
            baseFactory.GetConfigNode(Arg.Any<string>()).Returns(new XmlDocument());
            baseFactory.CreateObject<ISolrFieldSerializer<SolrSchemaField>>(Arg.Any<XmlNode>()).Returns(new SolrSchemaFieldSerializer());

            // Act
            var result = configFactory.CreateSerializer<SolrSchemaField>();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<SolrSchemaFieldSerializer>();
        }

        [Fact]
        public void CreateSerializer_ShouldReturnCopyFieldSerializer_WhenFieldTypeIsSolrSchemaCopyField()
        {
            // Arrange
            baseFactory.GetConfigNode(Arg.Any<string>()).Returns(new XmlDocument());
            baseFactory.CreateObject<ISolrFieldSerializer<SolrSchemaCopyField>>(Arg.Any<XmlNode>()).Returns(new SolrCopyFieldSerializer());

            // Act
            var result = configFactory.CreateSerializer<SolrSchemaCopyField>();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<SolrCopyFieldSerializer>();
        }

        [Fact]
        public void CreateSerializer_ShouldThrowInvalidOperationException_WhenNoSerializerFound()
        {
            // Act
            Action act = () => configFactory.CreateSerializer<string>();

            // Assert
            act.Should().Throw<InvalidOperationException>();
        }
    }
}