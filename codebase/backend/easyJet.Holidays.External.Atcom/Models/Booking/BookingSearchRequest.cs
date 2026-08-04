using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.Booking
{
    public class BookingSearchRequest : AtcomApiRequest<Internal.BookingSearchRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
        protected override string RequestNamespace => "AtComRes/BookingSearchRequest";
    }
}
