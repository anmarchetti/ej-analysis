using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Eskel.Models
{
    public class BookingsRequest : JsonApiRequest<object>
    {
        public BookingsRequest(TimeSpan? timeout = null)
        {
            _timeout = timeout;
        }

        private TimeSpan? _timeout;

        public override TimeSpan? Timeout => _timeout;

        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "token")]

        public string Token { get; set; }

        [DataMember(Name = "ReservationId")]
        public int? ReservationId { get; set; }

        [DataMember(Name = "CreatedDate")]
        public string CreatedDate { get; set; }

        [DataMember(Name = "DepartureDate")]
        public string DepartureDate { get; set; }

        [DataMember(Name = "ReturnDate")]
        public string ReturnDate { get; set; }

        [DataMember(Name = "IncludeMemos")]
        public string IncludeMemos { get; set; }
    }
}