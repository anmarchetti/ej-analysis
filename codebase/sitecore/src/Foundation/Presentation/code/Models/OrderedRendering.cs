using System.Xml.Linq;

namespace easyJet.Foundation.Presentation.Models
{
    public class OrderedRendering
    {
        public string Id { get; set; }

        public int Position { get; set; }

        public XElement LayoutXml { get; set; }
    }
}