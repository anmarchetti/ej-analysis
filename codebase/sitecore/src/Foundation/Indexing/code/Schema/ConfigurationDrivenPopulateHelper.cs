using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using easyJet.Foundation.Indexing.Schema.Configurations;
using easyJet.Foundation.Indexing.Schema.Fields;
using easyJet.Foundation.Indexing.Schema.Serializers;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.ContentSearch.SolrProvider.Pipelines.PopulateSolrSchema;
using SolrNet.Schema;

namespace easyJet.Foundation.Indexing.Schema
{
    /// <summary>
    /// This SchemaPopulateHelper implementation replaces the Sitecore built-in
    /// helper by picking the Solr managed schema configuration from a Sitecore
    /// config instead of having it hard coded.
    /// </summary>
    public class ConfigurationDrivenPopulateHelper : SolrV9SchemaPopulate
    {
        private readonly ISitecoreContextProvider sitecoreContextProvider;
        private readonly ISolrSchemaConfiguration solrSolrSchemaConfiguration;
        private readonly ISolrFieldSerializer<SolrSchemaField> fieldSerializer;
        private readonly ISolrFieldSerializer<SolrSchemaCopyField> copyFieldSerializer;

        public ConfigurationDrivenPopulateHelper(
            SolrSchema solrSchema,
            ISolrSchemaConfigurationFactory factory,
            ISitecoreContextProvider sitecoreContextProvider)
            : base(solrSchema)
        {
            this.sitecoreContextProvider = sitecoreContextProvider;
            solrSolrSchemaConfiguration = factory.Create();
            fieldSerializer = factory.CreateSerializer<SolrSchemaField>();
            copyFieldSerializer = factory.CreateSerializer<SolrSchemaCopyField>();
        }

        /// <inheritdoc />
        public override IEnumerable<XElement> GetAllFields()
        {
            if (!ValidateIndex())
            {
                return base.GetAllFields();
            }

            var allFields = base.GetAllFields().ToList();

            foreach (var field in solrSolrSchemaConfiguration.Fields)
            {
                allFields.Add(fieldSerializer.Serialize(field));
            }

            foreach (var copyField in solrSolrSchemaConfiguration.CopyFields)
            {
                allFields.Add(copyFieldSerializer.Serialize(copyField));
            }

            return allFields.Where(e => e != null);
        }

        /// <summary>
        /// Validates the current index name against the configuration.
        /// </summary>
        /// <returns><see langword="true"/> if the current index equal to index that set in the configuration.</returns>
        private bool ValidateIndex()
        {
            var configIndexes = solrSolrSchemaConfiguration.IndexNames;
            var selectedIndexes = sitecoreContextProvider.Items[Constants.SchemaIndexNameKey] as string;
            return !string.IsNullOrEmpty(selectedIndexes) && configIndexes.Any();
        }
    }
}
