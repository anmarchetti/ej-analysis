using System.Collections.Generic;
using System.Xml;

namespace easyJet.Feature.SitecoreEnhancment.Workbox
{
    public class WorkboxDictionary
    {
        public List<KeyValuePair<string, string>> Entries { get; private set; }

        public WorkboxDictionary()
        {
            Entries = new List<KeyValuePair<string, string>>();
        }

        public void AddEntries(string key, XmlNode node)
        {
            AddEntries(node);
        }

        public void AddEntries(XmlNode node)
        {
            var key = Sitecore.Xml.XmlUtil.GetAttribute("key", node);
            var value = Sitecore.Xml.XmlUtil.GetAttribute("value", node);

            if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(value))
            {
                return;
            }

            Entries.Add(new KeyValuePair<string, string>(key, value));
        }
    }
}