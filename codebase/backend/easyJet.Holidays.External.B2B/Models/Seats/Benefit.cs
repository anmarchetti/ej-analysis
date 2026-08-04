using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    [XmlRoot(ElementName = "Benefit")]
    public class Benefit
    {

        [XmlAttribute(AttributeName = "Key")]
        public string Key { get; set; }

        [XmlAttribute(AttributeName = "Quantity")]
        public int Quantity { get; set; }
    }
}