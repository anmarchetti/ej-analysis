using easyJet.Holidays.Api.Domain.Settings;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models
{
    public class B2BApiRequestBase
    {
        [XmlAttribute("APIVersion")]
        public string APIVersion { get; set; }

        [XmlAttribute("B2BAPIUserEmailAddress")]
        public string B2BAPIUserEmailAddress { get; set; }

        [XmlAttribute("B2BAPIUserPassword")]
        public string B2BAPIUserPassword { get; set; }

        public B2BApiRequestBase() { }

        public B2BApiRequestBase(B2BSettings b2bSettings)
        {
            APIVersion = b2bSettings.ApiVersion;
            B2BAPIUserEmailAddress = b2bSettings.EresUsername;
            B2BAPIUserPassword = b2bSettings.EresPassword;
        }
    }
}
