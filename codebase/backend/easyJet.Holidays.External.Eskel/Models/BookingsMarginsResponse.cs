using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Eskel;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Eskel.Models
{
    public class BookingsMarginsResponse : JsonApiResponse<BookingsMarginsResponseBody>
    {
        public override ApiError[] ApiErrors { get; } // Don't handle response body errors
    }

    [Serializable]
    [DataContract]
    public class BookingsMarginsResponseBody
    {
        [DataMember(Name = "bookings")]
        public IEnumerable<BookingMargin> Bookings { get; set; }
    }
}