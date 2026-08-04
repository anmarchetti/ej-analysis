using System;
using Sitecore.Diagnostics;
using Sitecore.Layouts;
using Sitecore.Xml.Serialization;

namespace easyJet.Foundation.Presentation.Extensions
{
    public static class RenderingDefinitionExtentions
    {
        /// <summary>
        /// Parse xml to RenderingDefinition.
        /// </summary>
        /// <param name="renderingDefinition">Rendering Definition model.</param>
        /// <param name="xml">Rendering Definition in xml format.</param>
        /// <returns>Parsed Rendering Definition.</returns>
        public static RenderingDefinition Parse(this RenderingDefinition renderingDefinition, string xml)
        {
            if (xml.Length == 0)
            {
                return null;
            }

            try
            {
                return XmlSerializable.LoadXml(xml, renderingDefinition.GetType()) as RenderingDefinition;
            }
            catch (Exception ex)
            {
                Log.Error($"Something goes wrong during parsing xml rendering definition. {ex.Message}", ex, renderingDefinition);
                return null;
            }
        }
    }
}