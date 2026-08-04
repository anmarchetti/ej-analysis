using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Eskel.Models
{
    public class BookingsMarginsRequest : JsonApiRequest<BookingMarginRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }

    [Serializable]
    [DataContract]
    public class BookingMarginRequestBody
    {
        [DataMember(Name = "token")]
        public string Token { get; set; }

        [DataMember(Name = "reservationIds")]
        public IEnumerable<uint> ReservationIds { get; set; }
    }
}