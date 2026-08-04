using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.GetMemberDetails
{
    public class AddMemberResponse : B2BApiResponseBase<AddMemberResponseBody>
    {
    }

    public class AddMemberResponseBody
    {
        [XmlAttribute]
        public string SuccessMessage { get; set; }
    }
}
