using easyJet.Holidays.Api.Domain.Settings;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.CountryInformation
{
    public class CountryInformationRequest : B2BRequestBase<CountryInformationRequestBody>
    {
    }

    [XmlRoot(ElementName = "CountryInformation")]
    public class CountryInformationRequestBody : B2BApiRequestBase
    {
        [XmlAttribute("LanguageCode")]
        public string LanguageCode { get; set; }

        public CountryInformationRequestBody() { }

        public CountryInformationRequestBody(B2BSettings b2bSettings) : base(b2bSettings) { }
    }
}
