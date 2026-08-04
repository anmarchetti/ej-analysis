using easyJet.Holidays.Api.Domain.Settings;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.GetMemberDetails
{
    public class GetMemberDetailsRequest : B2BRequestBase<GetMemberDetailsRequestBody>
    {
    }

    [XmlRoot(ElementName = "GetMemberDetails")]
    public class GetMemberDetailsRequestBody : B2BApiRequestBase
    {
        [XmlAttribute("MemberEmailAddress")]
        public string MemberEmailAddress { get; set; }

        [XmlAttribute("MemberPassword")]
        public string MemberPassword { get; set; }

        [XmlAttribute("ShowEncryptedMemberId")]
        public bool ShowEncryptedMemberId { get; set; }

        public GetMemberDetailsRequestBody() { }

        public GetMemberDetailsRequestBody(B2BSettings b2bSettings) : base(b2bSettings) { }
    }
}
