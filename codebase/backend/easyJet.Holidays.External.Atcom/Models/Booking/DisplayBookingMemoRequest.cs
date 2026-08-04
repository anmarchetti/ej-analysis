using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.Booking
{
    public class DisplayBookingMemoRequest : AtcomApiRequest<Internal.DisplayMemoRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
        protected override string RequestNamespace => "AtComRes/DisplayMemoRequest";
    }
}
