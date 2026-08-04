using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Indexing.Schema;
using easyJet.Foundation.Indexing.Schema.Configurations;
using easyJet.Foundation.Indexing.Schema.Fields;
using easyJet.Foundation.Indexing.Schema.Serializers;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Caching;
using SolrNet.Schema;
using Xunit;

namespace easyJet.Foundation.Indexing.Tests.Schema
{
    public class ConfigurationDrivenPopulateHelperTests
    {
        private readonly SolrSchema solrSchema;
        private readonly ISolrSchemaConfiguration solrSchemaConfiguration;
        private readonly ISolrSchemaConfigurationFactory factory;
        private readonly ISitecoreContextProvider sitecoreContextProvider;
        private readonly ISolrFieldSerializer<SolrSchemaField> fieldSerializer;
        private readonly ISolrFieldSerializer<SolrSchemaCopyField> copyFieldSerializer;

        private readonly ConfigurationDrivenPopulateHelper helper;

        public ConfigurationDrivenPopulateHelperTests()
        {
            solrSchema = Substitute.ForPartsOf<SolrSchema>();
            solrSchemaConfiguration = Substitute.For<ISolrSchemaConfiguration>();
            sitecoreContextProvider = Substitute.For<ISitecoreContextProvider>();
            fieldSerializer = Substitute.For<ISolrFieldSerializer<SolrSchemaField>>();
            copyFieldSerializer = Substitute.For<ISolrFieldSerializer<SolrSchemaCopyField>>();
            factory = Substitute.For<ISolrSchemaConfigurationFactory>();
            factory.Create().Returns(solrSchemaConfiguration);
            factory.CreateSerializer<SolrSchemaField>().Returns(fieldSerializer);
            factory.CreateSerializer<SolrSchemaCopyField>().Returns(copyFieldSerializer);
            sitecoreContextProvider.Items.Returns(new ItemsContext());

            helper = Substitute.ForPartsOf<ConfigurationDrivenPopulateHelper>(solrSchema, factory, sitecoreContextProvider);
        }

        [Theory(Skip = "Feature needs to be reworked due to changes in Sitecore 10.4")]
        [AutoData]
        public void GetAllFields_ShouldReturnAllFieldsAndCopyFields_IfIndexNameIsValid(string indexName)
        {
            // Arrange
            var field = new SolrSchemaField { Name = "testField" };
            var copyField = new SolrSchemaCopyField { Source = "sourceField", Destination = "destField" };
            solrSchemaConfiguration.Fields.Returns(new List<SolrSchemaField> { field });
            solrSchemaConfiguration.CopyFields.Returns(new List<SolrSchemaCopyField> { copyField });
            solrSchemaConfiguration.IndexNames.Returns(new HashSet<string> { indexName });

            sitecoreContextProvider.Items[Constants.SchemaIndexNameKey] = indexName;

            solrSchema.SolrFieldTypes = new List<SolrFieldType>()
            {
                new SolrFieldType("lowercase", "lowercase")
            };

            // Act
            var result = helper.GetAllFields().ToList();

            // Assert
            result.Should().NotBeNull();
            fieldSerializer.Received().Serialize(field);
            copyFieldSerializer.Received().Serialize(copyField);
        }

        [Fact(Skip = "Feature needs to be reworked due to changes in Sitecore 10.4")]
        public void GetAllFields_ShouldReturnOnlyBaseFields_IfIndexNameIsNotValid()
        {
            // Arrange
            solrSchemaConfiguration.IndexNames.Returns(new HashSet<string> { "indexName" });
            sitecoreContextProvider.Items[Constants.SchemaIndexNameKey] = "indexName2";

            solrSchema.SolrFieldTypes = new List<SolrFieldType>()
            {
                new SolrFieldType("lowercase", "lowercase")
            };

            // Act
            var result = helper.GetAllFields().ToList();

            // Assert
            result.Should().NotBeNull();
            fieldSerializer.DidNotReceive().Serialize(Arg.Any<SolrSchemaField>());
            copyFieldSerializer.DidNotReceive().Serialize(Arg.Any<SolrSchemaCopyField>());
        }
    }
}