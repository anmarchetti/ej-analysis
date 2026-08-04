using easyJet.Holidays.Api.Domain.Settings;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.B2BGetBooking
{
    public class B2BGetBookingRequest : B2BRequestBase<B2BGetBookingRequestBody>
    {
    }

    [XmlRoot(ElementName = "GetBookingSummaryRequestV1")]
    public class B2BGetBookingRequestBody : B2BApiRequestBase
    {
        [XmlElement(ElementName = "PNR")]
        public PNR PNR { get; set; }

        public B2BGetBookingRequestBody() { }

        public B2BGetBookingRequestBody(B2BSettings b2bSettings) : base(b2bSettings) { }
    }

    public class PNR
    {
        [XmlAttribute("BookingReference")]
        public string BookingReference { get; set; }

        [XmlAttribute("PassengerLastName")]
        public string PassengerLastName { get; set; }
    }
}
