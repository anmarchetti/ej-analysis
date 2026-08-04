using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.GetMemberDetails
{
    public class GetMemberDetailsResponse : B2BApiResponseBase<MemberDetailsRoot>
    {
    }

    public class MemberDetailsRoot
    {
        public MemberDetails MemberDetails { get; set; }
    }

    public class MemberDetails
    {
        public Member Member { get; set; }
    }

    public class Member
    {
        [XmlAttribute]
        public string Title { get; set; }

        [XmlAttribute]
        public string MemberEmailAddress { get; set; }

        [XmlAttribute]
        public string EncryptedMemberID { get; set; }

        [XmlAttribute]
        public string FirstName { get; set; }

        [XmlAttribute]
        public string LastName { get; set; }

        [XmlAttribute]
        public string MobilePhone { get; set; }

        [XmlAttribute]
        public string BirthDate { get; set; }

        [XmlAttribute]
        public string Address1 { get; set; }

        [XmlAttribute]
        public string Address2 { get; set; }

        [XmlAttribute]
        public string Country { get; set; }

        [XmlAttribute]
        public string City { get; set; }

        [XmlAttribute]
        public string PostalCode { get; set; }

        [XmlAttribute]
        public string MailingsFlag { get; set; }

        [XmlAttribute]
        public string easyJetMailingsFlag { get; set; }
    }
}
