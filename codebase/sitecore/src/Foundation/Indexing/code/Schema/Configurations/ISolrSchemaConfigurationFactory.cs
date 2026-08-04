using easyJet.Foundation.Indexing.Schema.Serializers;

namespace easyJet.Foundation.Indexing.Schema.Configurations
{
    public interface ISolrSchemaConfigurationFactory
    {
        /// <summary>
        /// Factory method to create <see cref="ISolrSchemaConfiguration"/>.
        /// </summary>
        /// <returns>Instance of <see cref="ISolrSchemaConfiguration"/></returns>
        ISolrSchemaConfiguration Create();

        /// <summary>
        /// Factory method to create <see cref="ISolrFieldSerializer{T}"/>.
        /// </summary>
        /// <typeparam name="T">The type of the field to serialize.</typeparam>
        /// <returns>Instance of <see cref="ISolrFieldSerializer{T}"/></returns>
        ISolrFieldSerializer<T> CreateSerializer<T>();
    }
}
