using easyJet.Holidays.Api.Domain.Data.Booking;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.B2BGetBooking
{
    public class B2BGetBookingResponse : B2BApiResponseBase<BookingRoot>
    {
    }

    public class BookingRoot
    {
        [XmlElement(ElementName = "GetBookingSummaryResponseV1")]
        public B2BData GetBookingSummaryResponse { get; set; }
    }
}