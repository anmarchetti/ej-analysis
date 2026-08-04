using System.Collections.Generic;
using System.Xml;
using easyJet.Foundation.Indexing.Schema.Fields;

namespace easyJet.Foundation.Indexing.Schema.Configurations
{
    /// <summary>
    /// Represents the configuration for Solr schema, including fields and copy fields.
    /// </summary>
    public class SolrSchemaConfiguration : ISolrSchemaConfiguration
    {
        /// <inheritdoc/>
        public List<SolrSchemaField> Fields { get; private set; } = new List<SolrSchemaField>();

        /// <inheritdoc/>
        public List<SolrSchemaCopyField> CopyFields { get; private set; } = new List<SolrSchemaCopyField>();

        /// <summary>
        /// Gets the name of the Solr index.
        /// </summary>
        public HashSet<string> IndexNames { get; private set; }

        public SolrSchemaConfiguration(string name)
        {
            IndexNames = ParseIndexNames(name);
        }

        /// <summary>
        /// Adds a field to the managed schema.
        /// </summary>
        /// <param name="node">The XML node representing the field.</param>
        public void AddField(XmlNode node)
        {
            if (node?.Attributes?["name"] == null)
            {
                return;
            }

            var field = new SolrSchemaField();
            SetProperties(node, field);
            Fields.Add(field);
        }

        /// <summary>
        /// Adds a copy field definition to the managed schema.
        /// </summary>
        /// <param name="node">The XML node representing the copy field.</param>
        public void AddCopyField(XmlNode node)
        {
            var copyField = ParseCopyFieldNode(node);
            if (copyField != null)
            {
                CopyFields.Add(copyField);
            }
        }

        /// <summary>
        /// Gets the value of a specified attribute from an XML node.
        /// </summary>
        /// <param name="node">The XML node containing the attribute.</param>
        /// <param name="name">The name of the attribute.</param>
        /// <param name="default">The default value to return if the attribute is not found.</param>
        /// <returns>The value of the attribute, or the default value if the attribute is not found.</returns>
        private static string GetStringParameter(XmlNode node, string name, string @default = null)
        {
            return node?.Attributes?[name]?.Value ?? @default;
        }

        /// <summary>
        /// Sets the properties of a Solr schema field based on the XML node attributes.
        /// </summary>
        /// <param name="node">The XML node containing the field attributes.</param>
        /// <param name="field">The Solr schema field to set properties for.</param>
        private static void SetProperties(XmlNode node, SolrSchemaField field)
        {
            if (node.Attributes?["type"] == null)
            {
                return;
            }

            field.Name = GetStringParameter(node, "name");
            foreach (XmlAttribute attr in node.Attributes)
            {
                // skip all attributes from other namespaces, such as Sitecore's patch:source="..."
                if (attr.Name == "name" || attr.Name.Contains(":"))
                {
                    continue;
                }

                field.Properties.Add(attr.Name, attr.Value);
            }
        }

        /// <summary>
        /// Parses an XML node to create a Solr schema copy field.
        /// </summary>
        /// <param name="node">The XML node representing the copy field.</param>
        /// <returns>The parsed Solr schema copy field, or null if the node is invalid.</returns>
        private static SolrSchemaCopyField ParseCopyFieldNode(XmlNode node)
        {
            if (node?.Attributes?["source"] == null || node.Attributes?["dest"] == null)
            {
                return null;
            }

            var copyField = new SolrSchemaCopyField
            {
                Source = GetStringParameter(node, "source"),
                Destination = GetStringParameter(node, "dest"),
            };
            return copyField;
        }

        private static HashSet<string> ParseIndexNames(string name)
        {
            return new HashSet<string>(name.Split('|'));
        }
    }
}
