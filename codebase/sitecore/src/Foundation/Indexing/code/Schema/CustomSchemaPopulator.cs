using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.ContentSearch.SolrProvider.Abstractions;
using Sitecore.ContentSearch.SolrProvider.Pipelines.PopulateSolrSchema;

namespace easyJet.Foundation.Indexing.Schema
{
    [ExcludeFromCodeCoverage]
    public class CustomSchemaPopulator : PopulateFields
    {
        private readonly ISitecoreContextProvider sitecoreContextProvider;

        public CustomSchemaPopulator(IPopulateHelperFactory populateFactory)
            : this(populateFactory, DependencyResolver.Current.GetService<ISitecoreContextProvider>())
        {
            sitecoreContextProvider = DependencyResolver.Current.GetService<ISitecoreContextProvider>();
        }

        public CustomSchemaPopulator(IPopulateHelperFactory populateFactory, ISitecoreContextProvider sitecoreContextProvider)
            : base(populateFactory)
        {
            this.sitecoreContextProvider = sitecoreContextProvider;
        }

        public override void Process(PopulateManagedSchemaArgs args)
        {
            SetIndexName(args);
            base.Process(args);
        }

        /// <summary>
        /// Save index name to reuse it in populating schema.
        /// It's using to update only necessary indexes.
        /// </summary>
        /// <param name="args">Arguments.</param>
        protected internal void SetIndexName(PopulateManagedSchemaArgs args)
        {
            var supportedIndexesString = Settings.GetSetting("Indexing.Solr.ManagedSchema.SupportedIndexes");
            if (string.IsNullOrEmpty(supportedIndexesString))
            {
                return;
            }

            var supportedIndexes = supportedIndexesString.Split('|').ToHashSet();
            var notSupportedIndexes = args.Indexes.Where(i => !supportedIndexes.Contains(i.Name));

            if (!notSupportedIndexes.Any())
            {
                sitecoreContextProvider.Items[Constants.SchemaIndexNameKey] = supportedIndexesString;
            }
        }
    }
}
