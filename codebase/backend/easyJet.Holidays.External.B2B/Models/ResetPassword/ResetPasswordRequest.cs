using easyJet.Holidays.Api.Domain.Settings;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.ResetPassword
{
    public class ResetPasswordRequest : B2BRequestBase<ResetPasswordRequestBody>
    {
    }

    [XmlRoot(ElementName = "SendResetMemberPasswordEmailRequest")]
    public class ResetPasswordRequestBody : B2BApiRequestBase
    {
        [XmlAttribute]
        public string MemberEmailAddress { get; set; }

        [XmlAttribute]
        public string CultureCode { get; set; }

        [XmlAttribute]
        public string LanguageCode { get; set; }

        public ResetPasswordRequestBody() { }

        public ResetPasswordRequestBody(B2BSettings b2bSettings) : base(b2bSettings) { }
    }
}
