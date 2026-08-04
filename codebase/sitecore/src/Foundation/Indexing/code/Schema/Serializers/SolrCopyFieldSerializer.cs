using System.Xml.Linq;
using easyJet.Foundation.Indexing.Schema.Fields;

namespace easyJet.Foundation.Indexing.Schema.Serializers
{
    /// <summary>
    /// Defines a Solr schema add copy field command.
    /// https://solr.apache.org/guide/6_6/schema-api.html
    /// </summary>
    public class SolrCopyFieldSerializer : ISolrFieldSerializer<SolrSchemaCopyField>
    {
        /// <inheritdoc />
        public XElement Serialize(SolrSchemaCopyField field)
        {
            var copyField = new XElement("add-copy-field");

            copyField.Add(new XElement("source", field.Source));
            copyField.Add(new XElement("dest", field.Destination));

            return copyField;
        }
    }
}
