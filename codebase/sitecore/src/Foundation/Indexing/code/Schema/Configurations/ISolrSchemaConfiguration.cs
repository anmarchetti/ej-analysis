using System.Collections.Generic;
using easyJet.Foundation.Indexing.Schema.Fields;

namespace easyJet.Foundation.Indexing.Schema.Configurations
{
    public interface ISolrSchemaConfiguration
    {
        /// <summary>
        /// Gets the list of fields in the Solr schema.
        /// </summary>
        List<SolrSchemaField> Fields { get; }

        /// <summary>
        /// Gets the list of copy fields in the Solr schema.
        /// </summary>
        List<SolrSchemaCopyField> CopyFields { get; }

        /// <summary>
        /// Gets the list of indexes where solr schema should be applied.
        /// </summary>
        HashSet<string> IndexNames { get; }
    }
}
