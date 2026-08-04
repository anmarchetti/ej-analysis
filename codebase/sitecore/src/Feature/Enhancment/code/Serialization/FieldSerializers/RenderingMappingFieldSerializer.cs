using System.Diagnostics.CodeAnalysis;
using easyJet.Feature.SitecoreEnhancment.Fields;
using Newtonsoft.Json;
using Sitecore.Data.Fields;
using Sitecore.LayoutService.Serialization;
using Sitecore.LayoutService.Serialization.FieldSerializers;

namespace easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers
{
    /// <summary>
    /// Serializes the Rendering Mapping field value into a structured JSON array
    /// of objects with key/value IDs.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class RenderingMappingFieldSerializer : IFieldSerializer
    {
        public RenderingMappingFieldSerializer(IFieldRenderer fieldRenderer)
        {
        }

        public bool EnableRenderedValues { get; set; }

        public void Serialize(Field field, JsonTextWriter writer)
        {
            if (field == null)
            {
                writer.WriteNull();
                return;
            }

            var mappingField = new RenderingMappingField(field);
            var mappings = mappingField.GetMappings();

            writer.WritePropertyName(field.Name);
            writer.WriteStartArray();

            foreach (var m in mappings)
            {
                writer.WriteStartObject();
                writer.WritePropertyName("keyId");
                writer.WriteValue(m.KeyId.Guid.ToString());
                writer.WritePropertyName("valueId");
                writer.WriteValue(m.ValueId.Guid.ToString());

                if (!string.IsNullOrEmpty(m.Parameters))
                {
                    writer.WritePropertyName("parameters");
                    writer.WriteValue(m.Parameters);
                }

                writer.WriteEndObject();
            }

            writer.WriteEndArray();
        }
    }
}
