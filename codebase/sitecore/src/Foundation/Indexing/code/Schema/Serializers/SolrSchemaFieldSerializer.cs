using System.Xml.Linq;
using easyJet.Foundation.Indexing.Schema.Fields;

namespace easyJet.Foundation.Indexing.Schema.Serializers
{
    /// <summary>
    /// Defines a Solr schema add field command.
    /// https://solr.apache.org/guide/6_6/schema-api.html
    /// </summary>
    public class SolrSchemaFieldSerializer : ISolrFieldSerializer<SolrSchemaField>
    {
        /// <inheritdoc />
        public XElement Serialize(SolrSchemaField field)
        {
            XElement xElement = new XElement("add-field");
            xElement.Add(new XElement("name", field.Name));

            foreach (var pair in field.Properties)
            {
                xElement.Add(new XElement(pair.Key, pair.Value));
            }

            return xElement;
        }
    }
}
