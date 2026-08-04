using System.Xml.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    public class CountryInformation
    {
        [XmlAttribute]
        public string IsoCountryCodeAlpha { get; set; }

        [XmlAttribute]
        public string CountryName { get; set; }

        [XmlAttribute]
        public string DialCode { get; set; }
    }
}
