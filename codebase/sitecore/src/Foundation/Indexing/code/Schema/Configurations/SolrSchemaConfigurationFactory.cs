using System;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Indexing.Schema.Fields;
using easyJet.Foundation.Indexing.Schema.Serializers;
using Sitecore.Abstractions;

namespace easyJet.Foundation.Indexing.Schema.Configurations
{
    [Service(typeof(ISolrSchemaConfigurationFactory), Lifetime = DependencyInjection.Lifetime.Transient)]
    public class SolrSchemaConfigurationFactory : ISolrSchemaConfigurationFactory
    {
        private readonly BaseFactory factory;

        public SolrSchemaConfigurationFactory(BaseFactory factory)
        {
            this.factory = factory;
        }

        /// <inheritdoc />
        public ISolrSchemaConfiguration Create()
        {
            var xmlNode = factory.GetConfigNode("contentSearch/indexConfigurations/solrManagedSchemaConfigurations/solrManagedSchema");
            return factory.CreateObject<ISolrSchemaConfiguration>(xmlNode);
        }

        /// <inheritdoc />
        public ISolrFieldSerializer<T> CreateSerializer<T>()
        {
            var serializer = GetSerializerType(typeof(T));
            if (serializer == null)
            {
                throw new InvalidOperationException($"No serializer found for type {typeof(T).Name}");
            }

            return (ISolrFieldSerializer<T>)serializer;
        }

        private object GetSerializerType(Type fieldType)
        {
            var configPath = "contentSearch/indexConfigurations/solrManagedSchemaConfigurations/fieldSerializers";
            var xmlNode = factory.GetConfigNode(configPath);

            if (fieldType == typeof(SolrSchemaField))
            {
                return factory.CreateObject<ISolrFieldSerializer<SolrSchemaField>>(xmlNode.SelectSingleNode("fieldSerializer"));
            }
            else if (fieldType == typeof(SolrSchemaCopyField))
            {
                return factory.CreateObject<ISolrFieldSerializer<SolrSchemaCopyField>>(xmlNode.SelectSingleNode("copyFieldSerializer"));
            }

            return null;
        }
    }
}
