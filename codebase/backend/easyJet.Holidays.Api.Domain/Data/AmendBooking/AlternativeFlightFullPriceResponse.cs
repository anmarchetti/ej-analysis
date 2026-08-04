using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    [Serializable]
    [DataContract]
    public class AlternativeFlightFullPriceResponse
    {

        [DataMember(Name = "amendTransports")]
        public IEnumerable<AmendTransport> AmendTransports { get; set; }
    }
}