using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.BulkToolBooking
{
    [Serializable]
    [DataContract]
    public class BulkToolRequest
    {
        [DataMember(Name = "booking")]
        public Booking Booking { get; set; }
    }
}
