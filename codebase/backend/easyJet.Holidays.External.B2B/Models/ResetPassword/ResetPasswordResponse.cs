using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.GetMemberDetails
{
    public class ResetPasswordResponse : B2BApiResponseBase<ResetPasswordResponseBody>
    {
    }

    public class ResetPasswordResponseBody
    {
        [XmlAttribute]
        public string SuccessMessage { get; set; }
    }
}
