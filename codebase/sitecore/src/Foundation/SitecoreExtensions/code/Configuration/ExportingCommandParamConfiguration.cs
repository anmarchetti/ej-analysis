using System;
using System.Xml;
using Sitecore.Configuration;

namespace easyJet.Foundation.SitecoreExtensions.Configuration
{
    public class ExportingCommandParamConfiguration
    {
        public static ExportingCommandParam GetItemByCommandName(string commandName)
        {
            var node = Factory.GetConfigNode("exportingCommandParamList");
            if (node == null)
            {
                return null;
            }

            foreach (XmlNode child in node.ChildNodes)
            {
                if (child.Attributes != null && child.Attributes[nameof(commandName)].Value.Equals(commandName, StringComparison.InvariantCultureIgnoreCase))
                {
                    return new ExportingCommandParam(child.Attributes["templateId"].Value);
                }
            }

            return null;
        }
    }
}