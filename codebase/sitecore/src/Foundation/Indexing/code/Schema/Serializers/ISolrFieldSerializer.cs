using System.Xml.Linq;

namespace easyJet.Foundation.Indexing.Schema.Serializers
{
    public interface ISolrFieldSerializer<in T>
    {
        /// <summary>
        /// Serializes the specified field.
        /// </summary>
        /// <param name="field">Solr Shema Field.</param>
        /// <returns>Serialized field.</returns>
        XElement Serialize(T field);
    }
}
