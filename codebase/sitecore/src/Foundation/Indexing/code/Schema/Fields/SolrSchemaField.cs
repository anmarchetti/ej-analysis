using System.Collections.Generic;

namespace easyJet.Foundation.Indexing.Schema.Fields
{
    public class SolrSchemaField
    {
        public string Name { get; set; }

        public IDictionary<string, string> Properties { get; } = new Dictionary<string, string>();

        public SolrSchemaField()
        {
        }

        public SolrSchemaField(string name)
        {
            Name = name;
        }
    }
}
