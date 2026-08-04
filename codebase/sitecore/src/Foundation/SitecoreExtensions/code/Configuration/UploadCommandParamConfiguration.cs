using System;
using System.Xml;
using Sitecore.Configuration;

namespace easyJet.Foundation.SitecoreExtensions.Configuration
{
    public static class UploadCommandParamConfiguration
    {
        public static UploadCommandParam GetItemByCommandName(string commandName)
        {
            var node = Factory.GetConfigNode("uploadingCommandParamList");
            if (node == null)
            {
                return null;
            }

            foreach (XmlNode child in node.ChildNodes)
            {
                if (child.Attributes != null && child.Attributes[nameof(commandName)].Value.Equals(commandName, StringComparison.InvariantCultureIgnoreCase))
                {
                    return new UploadCommandParam(child.Attributes["templateId"].Value, child.Attributes["fileFieldId"].Value, child.Attributes["csvDelimiter"].Value);
                }
            }

            return null;
        }
    }
}