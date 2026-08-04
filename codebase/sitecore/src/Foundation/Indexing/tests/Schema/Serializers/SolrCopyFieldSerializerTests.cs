using easyJet.Foundation.Indexing.Schema.Fields;
using easyJet.Foundation.Indexing.Schema.Serializers;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Indexing.Tests.Schema.Serializers
{
    public class SolrCopyFieldSerializerTests
    {
        private readonly SolrCopyFieldSerializer serializer;

        public SolrCopyFieldSerializerTests()
        {
            serializer = new SolrCopyFieldSerializer();
        }

        [Fact]
        public void Serialize_ShouldReturnXElement_WithCopyFieldAttributes()
        {
            // Arrange
            var copyField = new SolrSchemaCopyField
            {
                Source = "sourceField",
                Destination = "destField"
            };

            // Act
            var result = serializer.Serialize(copyField);

            // Assert
            result.Should().NotBeNull();
            result.Name.LocalName.Should().Be("add-copy-field");
            result.Element("source").Value.Should().Be("sourceField");
            result.Element("dest").Value.Should().Be("destField");
        }
    }
}