using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.Indexing.Schema.Configurations;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.ContentSearch.SolrProvider.Abstractions;
using Sitecore.ContentSearch.SolrProvider.Pipelines.PopulateSolrSchema;
using SolrNet.Schema;

namespace easyJet.Foundation.Indexing.Schema
{
    /// <summary>
    /// Replaces the Sitecore DefaultPopulateHelperFactory from the config, so
    /// that we can replace the built-in SchemaPopulateHelper
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class ConfigurationDrivenPopulateHelperFactory : IPopulateHelperFactory
    {
        private readonly ISolrSchemaConfigurationFactory configurationFactory;
        private readonly ISitecoreContextProvider sitecoreContextProvider;

        public ConfigurationDrivenPopulateHelperFactory(ISolrSchemaConfigurationFactory configurationFactory, ISitecoreContextProvider sitecoreContextProvider)
        {
            this.configurationFactory = configurationFactory;
            this.sitecoreContextProvider = sitecoreContextProvider;
        }

        /// <inheritdoc />
        public ISchemaPopulateHelper GetPopulateHelper(SolrSchema solrSchema)
        {
            return new ConfigurationDrivenPopulateHelper(solrSchema, configurationFactory, sitecoreContextProvider);
        }
    }
}
