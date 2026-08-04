using easyJet.Holidays.Api.Domain.Settings;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.AddMember
{
    public class AddMemberRequest : B2BRequestBase<AddMemberRequestBody>
    {
    }

    [XmlRoot(ElementName = "AddMember")]
    public class AddMemberRequestBody : B2BApiRequestBase
    {
        public MemberDataRequestBody MemberData { get; set; }

        public AddMemberRequestBody() { }

        public AddMemberRequestBody(B2BSettings b2bSettings) : base(b2bSettings) { }
    }

    public class MemberDataRequestBody
    {
        [XmlAttribute]
        public string EmailAddress { get; set; }
        [XmlAttribute]
        public string Password { get; set; }

        [XmlAttribute]
        public string LanguageCode { get; set; }

        [XmlAttribute]
        public string CultureCode { get; set; }

        [XmlAttribute]
        public string TitleTypeCode { get; set; }

        [XmlAttribute]
        public string FirstName { get; set; }

        [XmlAttribute]
        public string LastName { get; set; }

        [XmlAttribute]
        public string Address1 { get; set; }

        [XmlAttribute]
        public string Address2 { get; set; }

        [XmlAttribute]
        public string City { get; set; }

        [XmlAttribute]
        public string PostalCode { get; set; }

        [XmlAttribute]
        public string ISOCountryCode { get; set; }

        [XmlAttribute]
        public string MobilePhone { get; set; }

        [XmlAttribute]
        public string OptInForEasyJetMailing { get; set; }

        [XmlAttribute]
        public string OptInForMailing { get; set; }

        [XmlAttribute]
        public string BirthDate { get; set; }

        /// <summary>
        /// Represents preferred airport one of the member. It allows length upto 3 characters
        /// </summary>
        [XmlAttribute]
        public string PreferredAirportOne { get; set; }

        /// <summary>
        /// Represents preferred airport two of the member. It allows length upto 3 characters
        /// </summary>
        [XmlAttribute]
        public string PreferredAirportTwo { get; set; }

        /// <summary>
        /// Represents preferred airport three of the member. It allows length upto 3 characters
        /// </summary>
        [XmlAttribute]
        public string PreferredAirportThree { get; set; }
    }
}
